# Celery — задачи игрового цикла

Файл: `backend/ai/tasks.py`, `backend/servers/tasks.py`

## Игровой цикл

```
game_start (WS)
  → ServerService.start_game() → Game + Rounds (промпты Groq, русский)
  → cache.set(game:{id}:players_count)
  → start_round.delay(first_round_id, game_id, room_group)

start_round
  → round.started_at = now()
  → force_grade_round.apply_async(countdown=65) → task_id в Redis
  → очистить debuff_active:* и used_debuff:* для всех игроков
  → push round_started {round_id, round_number, prompt, duration: 60}

[60 сек — игроки рисуют и применяют дебаффы]

round_end (WS от каждого игрока)
  → рисунок в Redis round:{id}:drawing:{user_id}
  → counter round:{id}:submitted++
  → если все сдали → revoke force задачу → grade_round.delay()

grade_round
  → Redis lock (grading_lock TTL=120s)
  → collect drawings из Redis
  → upload каждого в Cloudinary (folder=drawings, public_id={round_id}_{user_id})
  → grade_drawing() через Groq для каждого → {score, comment}
  → Score.objects.update_or_create() атомарно
  → RoundService.finish(round_obj)
  → coin_key += coins_earned (внутри транзакции)
  → on_commit: start_round.apply_async(countdown=10) или game_over.apply_async(countdown=10)
  → _cleanup_round(round_id)
  → push round_results {scores: [...]}

force_grade_round [+65 сек страховка]
  → если round.is_finished → skip
  → иначе → grade_round.delay()

game_over
  → aggregate totals (Sum value, Sum coins_earned по игрокам)
  → GameService.finish() → sync_coins_from_redis() → winner +1 рейтинг
  → server.delete()
  → on_commit: delete_game.apply_async(countdown=60)
  → cache cleanup (players_count, debuff_active:*)
  → push game_over {final_scores: [...]}
  → cleanup_drawings.apply_async(countdown=60)
```

## Задачи

### `start_round(round_id, game_id, room_group)`
- Устанавливает `round.started_at = now()`
- Планирует `force_grade_round` через 65s, сохраняет `task_id`
- Очищает `debuff_active` и `used_debuff` для всех игроков раунда
- Пушит `round_started`

### `grade_round(round_id, room_group)` — bind=True, max_retries=3
Двухфазный:
1. HTTP к Groq + Cloudinary upload (до транзакции, serial)
2. Атомарная запись Score + coins в Redis (внутри `transaction.atomic`)

### `force_grade_round(round_id, room_group)`
Страховка. Запускается через 65s. Проверяет `is_finished`, вызывает `grade_round.delay()`.

### `game_over(game_id, room_group)`
- Django ORM `Sum` для итогов
- `GameService.finish()` → `ScoreService.sync_coins_from_redis()`
- Удаляет `Server` из БД (в транзакции)
- Планирует `delete_game` и `cleanup_drawings` через 60s (on_commit)

### `kick_offline_player(game_id, room_group, user_id, room_code)`
- Проверяет `game:{id}:offline:{user_id}` — если нет → игрок переподключился, skip
- Удаляет игрока из `server.players`
- Пушит `player_left` с `kicked=True`
- Удаляет offline ключ

### `delete_game(game_id)`
Удаляет Game (+ связанные Round, Score) через 60s после game_over.

### `cleanup_drawings(game_id)`
Удаляет рисунки из Cloudinary для всех раундов игры:
```python
cloudinary.api.delete_resources_by_prefix(f"drawings/{round_obj.id}_")
```

### `cleanup_game(game_id, room_code)` *(servers → ai)*
Вызывается когда все игроки отключились после завершённой игры (идемпотентный):
- Cloudinary cleanup всех раундов
- `cache.delete_many(game:{id}:*)`
- `server.delete()` если ещё существует

### `delete_server_if_host_absent(room_code, room_group)` *(servers/tasks.py)*
Вызывается через 10s grace period после отключения хоста:
- Проверяет `server:{room_code}:host_disconnected`
- Если ключ ещё есть → удаляет сервер, пушит `server_deleted`

## Временная шкала раунда

```
t=0    start_round → round_started
t=0    force_grade_round запланирован на t=65

t=60   таймер фронта → round_end от игроков
t≤60   если все сдали → revoke force → grade_round.delay()

t=65   force_grade_round (страховка, если не все сдали)

После grade_round:
t+10   start_round следующего раунда (или game_over)
```

## Настройки Celery

- Broker: Redis DB 0
- Result backend: Redis DB 0
- `CELERY_TASK_ALWAYS_EAGER = False` в prod
- Мониторинг: Flower (`make flower`)
