# Battle-cursor — CLAUDE.md

## Описание проекта
PvP браузерная игра где до 8 игроков одновременно рисуют по заданным промптам, применяют дебаффы друг к другу и получают оценки от Groq AI. Проект позиционируется как портфолио + статья на Хабр и как дипломный проект.

---

## Стек

### Backend
- Django 6 + DRF
- SimpleJWT (авторизация)
- Django Channels + Daphne (WebSocket)
- Celery + Beat + Flower (фоновые задачи)
- Redis (channel layer + cache + broker)
- Cloudinary (медиа файлы)
- Groq API `` (оценка рисунков)
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
│   ├── ai/              # Celery задачи + Groq оценка
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
- События WS: `cursor_move`, `draw`, `ping`, `game_start`
- Middleware: `JWTAuthMiddleware` для WS авторизации
- Онлайн статус: Redis key `user:{id}:online` TTL=20 сек

#### `game`
- Модели: `Game`, `Round`, `Score`
- Эндпоинты: детали игры, раунды, счета (только ручное тестирование)
- Игра создаётся через WebSocket `game_start` → `ServerService.start_game()`
- Раундов = кол-во игроков (макс 8), 60 сек на раунд

#### `ai`
- Celery задачи: батчевая оценка рисунков через Groq по окончании раунда
- Результаты → DB + push через Channels
- Ещё не реализован

---

## Игровая механика
- Раундов = кол-во игроков (макс 8)
- 60 секунд на раунд
- Монеты = `score × 10` (Groq оценивает 0.1–5.0)
- Дебаффы стоят 2–5 монет
- Стартовый баланс — 10 монет
- 5 уровней редкости: COMMON → LEGENDARY
- 5 дефолтных дебаффов (`is_default=True`) нельзя заблокировать канвасом
- Epic дебаффы требуют решения задачи, Mythic — звуковые, Legendary — влияют на рисунок

---

## WebSocket события

### Клиент → Сервер
```json
{"type": "cursor_move", "x": 100, "y": 200, "cursor_id": "uuid"}
{"type": "draw", "stroke": {...}}
{"type": "ping", "timestamp": 1234567890}
{"type": "game_start"}# Battle-cursor — CLAUDE.md

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
- Groq API `` (оценка рисунков)
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
│   ├── ai/              # Celery задачи + Groq оценка
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
- События WS: `cursor_move`, `draw`, `ping`, `game_start`
- Middleware: `JWTAuthMiddleware` для WS авторизации
- Онлайн статус: Redis key `user:{id}:online` TTL=20 сек

#### `game`
- Модели: `Game`, `Round`, `Score`
- Эндпоинты: детали игры, раунды, счета (только ручное тестирование)
- Игра создаётся через WebSocket `game_start` → `ServerService.start_game()`
- Раундов = кол-во игроков (макс 8), 60 сек на раунд

#### `ai`
- Celery задачи: батчевая оценка рисунков через Groq по окончании раунда
- Результаты → DB + push через Channels
- Ещё не реализован

---

## Игровая механика
- Раундов = кол-во игроков (макс 8)
- 60 секунд на раунд
- Монеты = `score × 10` (Groq оценивает 0.1–5.0)
- Дебаффы стоят 2–5 монет
- Стартовый баланс — 10 монет
- 5 уровней редкости: COMMON → LEGENDARY
- 5 дефолтных дебаффов (`is_default=True`) нельзя заблокировать канвасом
- Epic дебаффы требуют решения задачи, Mythic — звуковые, Legendary — влияют на рисунок

---

## WebSocket события

### Клиент → Сервер
```json
{"type": "cursor_move", "x": 100, "y": 200, "cursor_id": "uuid"}
{"type": "draw", "stroke": {...}}
{"type": "ping", "timestamp": 1234567890}
{"type": "game_start"}
```

### Сервер → Клиент
```json
{"type": "player_joined", "user_id": "uuid", "username": "name"}
{"type": "player_left", "user_id": "uuid", "username": "name"}
{"type": "cursor_update", "user_id": "uuid", "username": "name", "x": 100, "y": 200, "cursor_id": "uuid"}
{"type": "draw_update", "user_id": "uuid", "stroke": {...}}
{"type": "pong", "timestamp": 1234567890}
{"type": "game_start", "room_code": "XXXXXXXX"}
{"type": "error", "detail": "..."}
```

### Коды закрытия WS
- `4001` — не авторизован
- `4003` — нет доступа (не в комнате)
- `4004` — комната не найдена

---

## Redis
- DB 0: channel layer (WebSocket сообщения между consumers)
- DB 1: cache (профили, магазин, онлайн статус)
- Broker: DB 0 (Celery)

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

WebSocket тестируется только вручную через Postman GUI.

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
- ✅ `servers` — полностью реализован (REST + WebSocket)
- ✅ `game` — полностью реализован
- ⏳ `ai` — следующий этап (Celery + Groq)
- ⏳ Frontend — в процессе
- ⏳ Docker — после завершения бэкенда
```

### Сервер → Клиент
```json
{"type": "player_joined", "user_id": "uuid", "username": "name"}
{"type": "player_left", "user_id": "uuid", "username": "name"}
{"type": "cursor_update", "user_id": "uuid", "username": "name", "x": 100, "y": 200, "cursor_id": "uuid"}
{"type": "draw_update", "user_id": "uuid", "stroke": {...}}
{"type": "pong", "timestamp": 1234567890}
{"type": "game_start", "room_code": "XXXXXXXX"}
{"type": "error", "detail": "..."}
```

### Коды закрытия WS
- `4001` — не авторизован
- `4003` — нет доступа (не в комнате)
- `4004` — комната не найдена

---

## Redis
- DB 0: channel layer (WebSocket сообщения между consumers)
- DB 1: cache (профили, магазин, онлайн статус)
- Broker: DB 0 (Celery)

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

WebSocket тестируется только вручную через Postman GUI.

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
- ✅ `servers` — полностью реализован (REST + WebSocket)
- ✅ `game` — полностью реализован
- ⏳ `ai` — следующий этап (Celery + Groq)
- ⏳ Frontend — в процессе
- ⏳ Docker — после завершения бэкенда
