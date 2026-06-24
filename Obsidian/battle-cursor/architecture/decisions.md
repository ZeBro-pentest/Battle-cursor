---
tags: [architecture]
---

# Архитектурные решения — Battle-cursor

## Стек

### Backend
| Технология | Роль |
|---|---|
| Django 6 + DRF | REST API |
| SimpleJWT | Авторизация, access 15 мин / refresh 7 дней |
| Django Channels + Daphne | WebSocket, ASGI сервер |
| Celery + Beat + Flower | Фоновые задачи игрового цикла |
| Redis DB0 | Channel layer + Celery broker |
| Redis DB1 | Cache (профили, магазин, онлайн, игровое состояние) |
| Cloudinary | Медиа файлы (рисунки игроков, курсоры, канвасы) |
| Groq API | Оценка рисунков + генерация промптов |
| Mailtrap | Email (верификация) |
| SQLite | БД — постоянный выбор, PostgreSQL не планируется |

### Frontend
| Технология | Роль |
|---|---|
| React 19 + TypeScript | UI |
| Redux Toolkit | State management |
| React Router v7 | Routing (SPA) |
| Vite | Bundler, `base: '/static/'` |
| Axios | HTTP клиент |
| React Hook Form + Zod | Формы + валидация |
| нативный WebSocket | WS клиент (без библиотек) |

Без Tailwind CSS и Framer Motion.

> **Desktop only** — мобильный формат не поддерживается.

---

## Слоистость

```
urls → views → serializers → services → repositories → models
```

- Кэш-логика **только** в слое `services`
- Каждое приложение имеет `config.py` для констант
- Валидаторы живут в `validators.py` (локальные импорты для избежания циклов)

---

## Redis ключи

| Ключ | Значение | TTL |
|---|---|---|
| `user:{id}:online` | 1 | 20 сек |
| `game:{id}:players_count` | int | 3600 сек |
| `round:{id}:drawing:{user_id}` | `{image_base64, image_url}` | 300 сек |
| `round:{id}:task_id` | Celery task ID | 120 сек |
| `game:{id}:debuff_active:{user_id}` | debuff_id | duration сек |

- DB 0: channel layer + Celery broker
- DB 1: cache

---

## WebSocket

### Коды закрытия
- `4001` — не авторизован
- `4003` — нет доступа (не в комнате)
- `4004` — комната не найдена

### Авторизация WS
`JWTAuthMiddleware` в `servers/middleware.py` — извлекает JWT из query string, аутентифицирует пользователя до подключения к consumer.

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
{"type": "cursor_update", "user_id": "uuid", "username": "name", "x": 100, "y": 200}
{"type": "draw_update", "user_id": "uuid", "stroke": {...}}
{"type": "pong", "timestamp": 1234567890}
{"type": "game_start", "room_code": "XXXXXX", "game_id": "uuid"}
{"type": "round_started", "round_id": "uuid", "round_number": 1, "prompt": "...", "duration": 60}
{"type": "round_results", "round_id": "uuid", "round_number": 1, "scores": [...]}
{"type": "game_over", "game_id": "uuid", "final_scores": [...]}
{"type": "debuff_received", "debuff_id": "blur", "duration": 5, "from_user_id": "uuid", "target_id": "uuid"}
{"type": "error", "detail": "..."}
```

---

## Email

- **Prod**: Gmail SMTP (`EMAIL_HOST=smtp.gmail.com`, port 587, TLS)
- **Tests**: Mailtrap (`sandbox.smtp.mailtrap.io`, port 2525)
- Шаблоны писем: `backend/templates/emails/verification.html`, `welcome.html`

---

## Git префиксы

| Префикс | Когда |
|---|---|
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `refactor:` | Рефакторинг без изменения поведения |
| `wip:` | Незавершённая работа |
| `docs:` | Изменения только в документации |
| `style:` | Форматирование, без изменения логики |
| `test:` | Тесты |
| `perf:` | Производительность |
| `chore:` | Зависимости, конфиги |
| `build:` | Сборочная система |
| `revert:` | Откат коммита |

---

## Инициализация данных

```bash
python backend/manage.py init_game_data
```

Загружает курсоры и канвасы из `backend/assets/images/` + `backend/game/metadata.json` в БД.

---

## Известные технические решения

| Проблема | Решение |
|---|---|
| Циклический импорт в validators | Локальные импорты внутри функций |
| UUID сериализация в `group_send` | `str(self.user.id)` |
| Redis RESP3 несовместимость | `redis==4.6.0` |
| Статика под Daphne | `collectstatic` + порядок в `INSTALLED_APPS` |
| Порядок импортов в `asgi.py` | `get_asgi_application()` до импортов роутинга |

---

## Связанные заметки
- [[features/game-cycle]] — подробный игровой цикл
- [[features/debuffs]] — система дебаффов
- [[features/groq-scoring]] — AI оценка
- [[data/models-game]] — модели Game, Round, Score
- [[data/models-server]] — модель Server
