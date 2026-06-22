# Battle-cursor — CLAUDE.md

## Описание проекта
PvP браузерная игра где до 8 игроков одновременно рисуют по заданным промптам, применяют дебаффы друг к другу и получают оценки от Groq AI. Проект позиционируется как портфолио + статья на Хабр.

---

## Стек

### Backend
- Django 6 + DRF
- SimpleJWT (авторизация)
- Django Channels + Daphne (WebSocket)
- Celery + Beat + Flower (фоновые задачи)
- Redis (channel layer + cache + broker)
- Cloudinary (медиа файлы)
- Groq API (оценка рисунков + генерация промптов)
- Mailtrap (email)
- SQLite (постоянный выбор, переход на PostgreSQL не планируется)

### Frontend
- React 19 + TypeScript
- Redux Toolkit
- React Router v7
- Vite
- Axios
- React Hook Form + Zod
- Без Tailwind CSS и Framer Motion

### Тестирование
- pytest + pytest-django
- Postman + Newman (REST автотесты)
- Postman GUI (WebSocket ручное тестирование)
- Playwright + Allure (e2e)

---

## Структура проекта

```
Battle-cursor/
├── backend/
│   ├── config/          # settings.py, urls.py, asgi.py, celery.py
│   ├── users/           # регистрация, логин, профиль, курсоры, канвасы
│   ├── market/          # магазин, инвентарь, покупки
│   ├── servers/         # комнаты ожидания, WebSocket consumer
│   ├── game/            # игра, раунды, счета
│   ├── ai/              # Groq сервисы + Celery задачи игрового цикла
│   ├── Makefile
│   └── db.sqlite3
├── frontend/
├── tests/
│   ├── postman/
│   │   ├── collections/
│   │   ├── environments/
│   │   └── data/
│   └── ...
└── Diagrams/            # .drawio файл (ERD, Architecture, Sequence, Flowcharts)
```

---

## Архитектура

### Слоистость (строго соблюдается)
```
urls → views → serializers → services → repositories → models
```
- Кэш-логика только в слое `services`
- Каждое приложение имеет свой `config.py` для констант

### Приложения

#### `users`
- Модели: `User` (AbstractUser), `Cursor`, `Canvas`, `EmailVerification`
- Эндпоинты: регистрация, логин, логаут, refresh, верификация email, профиль, обновление профиля
- Redis кэш: профили, инвентарь, покупки

#### `market`
- Модели: `Inventory`, `Purchase`
- Эндпоинты: список магазина, покупка, инвентарь, история покупок
- Redis кэш: список магазина

#### `servers`
- Модели: `Server` (room_code, host FK→User, players M2M→User, status, max_players, game OneToOne→Game)
- Эндпоинты REST: создать, список, детали, join, leave
- WebSocket consumer: `GameConsumer` (`AsyncWebsocketConsumer`)
- Middleware: `JWTAuthMiddleware` для WS авторизации
- Онлайн статус: Redis key `user:{id}:online` TTL=20 сек

#### `game`
- Модели: `Game`, `Round`, `Score`
- `Score.value` — FloatField (0.1–5.0), `Score.image_url` — URLField (Cloudinary)
- Игра создаётся через WebSocket `game_start` → `ServerService.start_game()`
- Раундов = кол-во игроков (макс 8), 60 сек на раунд
- Дебаффы: `game/debuffs.py` — 60+ дебаффов, 5 уровней редкости (COMMON→LEGENDARY)
- `metadata.json` — курсоры и канвасы с привязанными дебаффами/защитами

#### `ai`
- `config.py` — константы: GROQ_MODEL, GROQ_API_URL, GRADING_PROMPT, PROMPT_GENERATION_PROMPT
- `services.py` — `grade_drawing(image_base64, prompt)` → `{score, comment}`, `generate_prompts(count)` → `list[str]`
- `tasks.py` — Celery задачи:
  - `start_round(round_id, game_id, room_group)` — стартует раунд, пушит `round_started`, ставит `force_grade_round` через 65 сек
  - `grade_round(round_id, room_group)` — оценивает рисунки из Redis через Groq, сохраняет Score в БД, пушит `round_results`, запускает следующий раунд или `game_over`
  - `force_grade_round(round_id, room_group)` — страховка 65 сек, пропускает если раунд уже завершён
  - `game_over(game_id, room_group)` — считает итоги, синхронизирует монеты/рейтинг в БД, пушит `game_over`
- Groq модель: `meta-llama/llama-4-maverick-17b-128e-instruct-fp8`
- Промпты генерируются на русском языке

---

## Игровая механика

### Очки и монеты
- Groq оценивает рисунок от 0.1 до 5.0
- Монеты начисляются только **по итогам всех раундов**: `score × 10`
- Во время игры монеты не тратятся и не начисляются
- Синхронизация монет в БД только после `game_over`
- Рейтинг: +1 победителю (1 место)

### Дебаффы
- Применение **одноразовое**, без списывания монет
- Нельзя применить дебафф если у цели уже активен другой дебафф
- Иммунитет цели (канвас защищает): `duration // 2`
- Redis ключ активного дебаффа: `game:{id}:debuff_active:{user_id}` TTL=duration

---

## Игровой цикл (Celery)

```
game_start (WS)
  → ServerService.start_game() → создаёт Game + Rounds (промпты от Groq на русском)
  → cache.set(game:{id}:players_count)
  → start_round.delay(first_round_id, game_id, room_group)

start_round
  → пушит round_started {round_id, round_number, prompt, duration: 60}
  → force_grade_round.apply_async(countdown=65) → сохраняет task_id в Redis

Игроки рисуют 60 сек + применяют дебаффы, затем:
  round_end (WS от каждого игрока)
    → сохраняет рисунок в Redis: round:{round_id}:drawing:{user_id}
    → если все сдали → revoke force задачу → grade_round.delay()

grade_round
  → забирает рисунки из Redis
  → grade_drawing() для каждого игрока через Groq
  → сохраняет Score в БД
  → чистит Redis
  → пушит round_results
  → если есть следующий раунд → start_round.apply_async(countdown=5)
  → если последний раунд → game_over.apply_async(countdown=5)

game_over
  → считает итоги по всем раундам
  → GameService.finish() → sync_coins_to_db() → update rating победителя
  → пушит game_over с final_scores
```

---

## WebSocket события

### Клиент → Сервер
```json
{"type": "cursor_move", "x": 100, "y": 200, "cursor_id": "uuid"}
{"type": "draw", "stroke": {...}}
{"type": "ping", "timestamp": 1234567890}
{"type": "game_start"}
{"type": "round_end", "round_id": "uuid", "image_base64": "...", "image_url": "..."}
{"type": "debuff_apply", "debuff_id": "blur", "target_id": "uuid"}
```

### Сервер → Клиент
```json
{"type": "player_joined", "user_id": "uuid", "username": "name"}
{"type": "player_left", "user_id": "uuid", "username": "name"}
{"type": "cursor_update", "user_id": "uuid", "username": "name", "x": 100, "y": 200, "cursor_id": "uuid"}
{"type": "draw_update", "user_id": "uuid", "stroke": {...}}
{"type": "pong", "timestamp": 1234567890}
{"type": "game_start", "room_code": "XXXXXX", "game_id": "uuid"}
{"type": "round_started", "round_id": "uuid", "round_number": 1, "prompt": "...", "duration": 60}
{"type": "round_results", "round_id": "uuid", "round_number": 1, "scores": [...]}
{"type": "game_over", "game_id": "uuid", "final_scores": [...]}
{"type": "debuff_received", "debuff_id": "blur", "duration": 5, "from_user_id": "uuid", "target_id": "uuid"}
{"type": "error", "detail": "..."}
```

### Коды закрытия WS
- `4001` — не авторизован
- `4003` — нет доступа (не в комнате)
- `4004` — комната не найдена

---

## Redis ключи

| Ключ | Значение | TTL |
|------|----------|-----|
| `user:{id}:online` | 1 | 20 сек |
| `game:{id}:players_count` | int | 3600 сек |
| `round:{id}:drawing:{user_id}` | `{image_base64, image_url}` | 300 сек |
| `round:{id}:task_id` | Celery task ID | 120 сек |
| `game:{id}:debuff_active:{user_id}` | debuff_id | duration сек |

- DB 0: channel layer + Celery broker
- DB 1: cache (профили, магазин, онлайн статус, игровое состояние)

---

## Команды запуска
```bash
make run          # запуск Daphne (основной сервер)
make migrate      # makemigrations + migrate
make shell        # Django shell
make celery       # Celery worker
make celery-beat  # Celery Beat (планировщик)
make flower       # Flower (мониторинг Celery)
make superuser    # создать суперпользователя
make flush-tokens # очистить истёкшие JWT токены
```

## Тестирование
```bash
# Newman (REST автотесты)
cd tests && npm run test:run

# Allure отчёт
cd tests && npm test
```

WebSocket и игровой цикл тестируются вручную через Postman GUI (см. WS_TESTING.md).

---

## Известные решения технических проблем
- Циклический импорт в validators → локальные импорты внутри функций
- UUID сериализация в `group_send` → `str(self.user.id)`
- Redis RESP3 несовместимость → `redis==4.6.0`
- Статика под Daphne → `collectstatic` + порядок в `INSTALLED_APPS`
- Порядок импортов в `asgi.py`: `get_asgi_application()` до импортов роутинга

---

## Текущее состояние
- ✅ `users` — полностью реализован
- ✅ `market` — полностью реализован
- ✅ `servers` — полностью реализован (REST + WebSocket + дебаффы)
- ✅ `game` — полностью реализован
- ✅ `ai` — полностью реализован (Groq оценка + генерация промптов + Celery игровой цикл)
- ⏳ Frontend — в процессе
- ⏳ Docker — после завершения бэкенда

## Context Navigation (Graphify + Obsidian)

### Правило 3 слоёв
1. **Сначала** — читай `graphify-out/GRAPH_REPORT.md` для понимания структуры кода
2. **Затем** — читай Obsidian vault (`~/vault/battle-cursor/`) для решений, архитектуры, текущего прогресса
3. **Только потом** — читай raw-файлы, если первые два слоя не дали ответа

### Когда пересобирать граф
- После структурных изменений (новые модули, крупные рефакторы)
- Команда: `graphify . --update` (только изменённые файлы)
- Граф персистентен — не пересобирать каждую сессию

### Запрещено
- Не модифицировать файлы в `graphify-out/` вручную
- Не перечитывать всю кодовую базу если граф уже содержит информацию

## Session Commands

### /resume
При получении этой команды:
1. Прочитай 3 последних лога из `~/vault/battle-cursor/logs/`
2. Прочитай `~/vault/battle-cursor/architecture/decisions.md`
3. Прочитай `graphify-out/GRAPH_REPORT.md`
4. Дай summary: текущее состояние и что осталось сделать

### /save
При получении этой команды:
1. Создай лог сессии в `~/vault/battle-cursor/logs/YYYY-MM-DD-<описание>.md`
2. Зафиксируй: что сделано, какие решения приняты, что pending
3. Добавь wikilinks на созданные/изменённые заметки

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Context Navigation (Graphify + Obsidian)

### Правило 3 слоёв
1. **Сначала** — читай `graphify-out/GRAPH_REPORT.md` для понимания структуры кода
2. **Затем** — читай `Obsidian/battle-cursor/` для решений, архитектуры, прогресса
3. **Только потом** — читай raw-файлы если первые два слоя не дали ответа

### Когда пересобирать граф
- После структурных изменений (новые модули, крупные рефакторы)
- Команда: `graphify . --update` (только изменённые файлы)
- Git hook автоматически пересобирает граф после каждого коммита

### Запрещено
- Не модифицировать файлы в `graphify-out/` вручную
- Не перечитывать всю кодовую базу если граф уже содержит информацию

## Session Commands

### /resume
При получении этой команды:
1. Прочитай `graphify-out/GRAPH_REPORT.md`
2. Прочитай 3 последних лога из `Obsidian/battle-cursor/logs/`
3. Прочитай `Obsidian/battle-cursor/architecture/decisions.md`
4. Дай summary: текущее состояние и что осталось сделать

### /save
При получении этой команды:
1. Создай лог сессии в `Obsidian/logs/YYYY-MM-DD-<описание>.md` (относительно корня проекта Battle-cursor/)
2. Зафиксируй: что сделано, какие решения приняты, что pending
3. Добавь wikilinks на созданные/изменённые файлы
