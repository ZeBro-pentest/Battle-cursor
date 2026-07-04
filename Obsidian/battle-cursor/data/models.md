# Модели данных

## users

### User (AbstractUser)
Таблица: `users` (кастомная через AUTH_USER_MODEL)

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUIDField PK | auto |
| username | CharField | inherited |
| email | EmailField unique | |
| password | CharField | inherited |
| cursor | FK → Cursor null | активный курсор |
| canvas | FK → Canvas null | активный канвас |
| coins | IntegerField default=0 | монеты |
| rating | IntegerField default=0 | рейтинг (+1 за победу) |
| profile_drawing | CloudinaryField | рисунок на странице профиля |
| email_verified | BooleanField default=False | |

### Cursor
Таблица: `cursors`

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUIDField PK | |
| name | CharField max=100 | |
| image | CloudinaryField | изображение (Cloudinary) |
| price | PositiveIntegerField default=0 | цена в монетах |
| debuffs | JSONField | список debuff_id (валидация validate_debuffs_list) |
| rarity | CharField choices=RarityChoices | NULL/COMMON/RARE/EPIC/MYTHIC/LEGENDARY |

### Canvas
Таблица: `canvases`

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUIDField PK | |
| name | CharField max=100 | |
| image | CloudinaryField | |
| price | PositiveIntegerField default=0 | |
| protections | JSONField | список debuff_id которые блокирует |
| rarity | CharField choices=RarityChoices | |

### EmailVerification
| Поле | Тип |
|------|-----|
| user | FK → User |
| token | UUIDField |
| created_at | DateTimeField auto_now_add |

## servers

### Server
Таблица: `servers`

| Поле | Тип | Описание |
|------|-----|---------|
| room_code | CharField max=8 unique | 8-char hex uppercase, auto-generated |
| host | FK → User | владелец комнаты |
| players | M2M → User | все игроки в комнате |
| status | CharField choices | waiting / in_progress / finished |
| max_players | PositiveSmallIntegerField default=8 | 2–8 |
| created_at | DateTimeField auto_now_add | |
| game | OneToOneField → Game null | связанная игра |

Статусы: `WAITING`, `IN_PROGRESS`, `FINISHED`

## game

### Game
Таблица: `games`

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUIDField PK | |
| number | CharField max=6 unique | 6-char random (A-Z0-9) |
| players | M2M → User | игроки (копия из Server) |
| max_players | PositiveIntegerField default=8 | |
| started | BooleanField default=False | |
| done | BooleanField default=False | |
| created_at | DateTimeField auto_now_add | |

### Round
Таблица: `rounds`

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUIDField PK | |
| game | FK → Game (CASCADE) | related_name=rounds |
| number | PositiveIntegerField | порядковый номер |
| prompt | CharField max=100 | промпт от Groq (русский) |
| started_at | DateTimeField null | устанавливается в start_round |
| ended_at | DateTimeField null | устанавливается в RoundService.finish() |
| is_finished | BooleanField default=False | |

Ordering: `["number"]`

### Score
Таблица: `scores`
unique_together: `(user, round)`

| Поле | Тип | Описание |
|------|-----|---------|
| id | UUIDField PK | |
| user | FK → User (CASCADE) | |
| round | FK → Round (CASCADE) | |
| value | FloatField default=0.0 | оценка Groq (0.1–5.0) |
| comment | TextField max=500 | комментарий Groq |
| image_url | URLField blank | Cloudinary URL рисунка |
| coins_earned | FloatField default=0.0 | value × 10 |

## market

### Inventory
Связывает User с курсорами/канвасами которые он владеет (не активный).

### Purchase
История покупок: user, item (cursor/canvas), price, created_at.

## Relationships

```
User ──── FK ──── Cursor (активный)
User ──── FK ──── Canvas (активный)
User ──── M2M ─── Server.players
User ──── M2M ─── Game.players
User ──── FK ──── Score (many)

Server ── OneToOne ── Game
Game ──── FK ──── Round (many)
Round ─── FK ──── Score (many)
Score ─── FK ──── User
```

## Сериализаторы

### CursorSerializer
Поля: `id, name, image_url, price, debuffs, rarity`
`image_url = SerializerMethodField → obj.image.url` (Cloudinary URL)

### CanvasSerializer
Поля: `id, name, image_url, price, protections, rarity`

### UserProfileSerializer
Вложенные: `cursor` (CursorSerializer), `canvas` (CanvasSerializer)
`profile_drawing_url = URLField(source="profile_drawing")`

### ScoreSerializer
Поля: `id, user_id, round_id, value, comment, image_url, coins_earned`

### RoundSerializer
Поля: `id, game_id, number, prompt, started_at, ended_at, is_finished`

### GameSerializer
Поля: `id, number, players, max_players, started, done, created_at`
