# Игровой цикл

## Фазы игры

```
Лобби (waiting) → IN_PROGRESS → FINISHED (→ Server удалён)
```

## 1. Создание и лобби

**REST эндпоинты:**
- `POST /servers/` — создать комнату (room_code = 8-char UUID hex uppercase)
- `POST /servers/{code}/join/` — войти
- `POST /servers/{code}/leave/` — выйти

После join — подключиться по WS: `ws://host/ws/game/{room_code}/?token=JWT`

WS → `player_joined` broadcast всем при каждом connect().

## 2. Начало игры

Только хост может отправить `{"type": "game_start"}`.

**handle_game_start:**
1. `ServerService.start_game()`:
   - Создаёт `Game` (players M2M, started=True)
   - Создаёт `Round` × N (N = кол-во игроков, max 8)
   - Промпты генерирует `generate_prompts(count)` → Groq на русском
2. `cache.set(game:{id}:players_count, N, timeout=3600)`
3. `group_send(game_start, {room_code, game_id})`
4. `start_round.delay(first_round.id, game.id, room_group)`

## 3. Раунд

### start_round (Celery)
```
round.started_at = now()
force_grade_round.apply_async(countdown=65) → task_id в Redis
Очистить debuff_active:* и used_debuff:* (все игроки)
push round_started {round_id, round_number, prompt, duration: 60}
```

### Во время раунда (60 сек)
- Фронт считает таймер `timeLeft` от 60 до 0
- Оверлей таймера при 30, 15, 3, 2, 1 секундах
- Игроки рисуют через WebSocket `draw` events (broadcast)
- Игроки применяют дебаффы через `debuff_apply`

### Сдача рисунка — round_end
Фронт отправляет при `timeLeft === 0`:
```json
{"type": "round_end", "round_id": "uuid", "image_base64": "...", "image_url": ""}
```

**handle_round_end:**
1. Сохраняет `round:{id}:drawing:{user_id}` в Redis
2. Атомарный счётчик `round:{id}:submitted++`
3. Если `submitted >= players_count`:
   - `revoke(force_grade_task_id)`
   - `grade_round.delay(round_id, room_group)`

## 4. Оценка раунда — grade_round (Celery)

```
Redis lock (grading_lock TTL=120s) — предотвращает двойной запуск

Для каждого игрока:
  1. cloudinary.uploader.upload(image_base64) → image_url
  2. grade_drawing(image_base64, prompt) → {score: 0.1–5.0, comment}
  3. coins_earned = round(score × 10, 1)

transaction.atomic():
  Score.update_or_create(user, round, value, comment, image_url, coins_earned)
  RoundService.finish(round_obj)  # is_finished=True, ended_at=now()
  cache coins: game:{id}:coins:{user_id} += coins_earned

  on_commit:
    → next round: start_round.apply_async(countdown=10)
    → last round: game_over.apply_async(countdown=10)

_cleanup_round(round_id)  # удалить drawings:* + task_id + submitted из Redis

push round_results {round_id, round_number, scores: [...]}
```

**Страховка force_grade_round** (через 65s):
- Проверяет `is_finished` — если True → skip
- Иначе → `grade_round.delay()`

## 5. Конец игры — game_over (Celery)

```
totals = Score.filter(round__game=game).values(user).annotate(Sum(value), Sum(coins_earned))

transaction.atomic():
  GameService.finish(game):
    game.done = True
    ScoreService.sync_coins_from_redis(game):
      Для каждого игрока: User.coins += redis_coins
      winner = игрок с max coins → User.rating += 1
      on_commit: cache.delete_many(coin_keys)
  server.delete()
  on_commit: delete_game.apply_async(countdown=60)

cache.delete(game:{id}:players_count)
cache.delete_many(game:{id}:debuff_active:*)

push game_over {game_id, final_scores: [{user_id, username, total_score, total_coins}]}
cleanup_drawings.apply_async(countdown=60)  # Cloudinary cleanup
```

## 6. После игры

**Фронт** переходит на страницу GameOver с `final_scores`.

**Через 60 сек:**
- `delete_game` — удаляет Game из БД (+ Round, Score cascade)
- `cleanup_drawings` — `cloudinary.api.delete_resources_by_prefix(drawings/{round_id}_)`

**При отключении всех после игры:**
- `cleanup_game` (идемпотентный) — Cloudinary + Redis + server.delete()

## Переподключение

При connect() во время активной игры → `game_state_sync`:
```json
{
  "type": "game_state_sync",
  "game_id": "uuid",
  "round_id": "uuid",
  "round_number": 2,
  "prompt": "Нарисуй...",
  "time_left": 38,
  "total_rounds": 3,
  "used_debuffs": ["blur"],
  "player_scores": {"uuid": 25.5},
  "round_history": [...]
}
```
`time_left = max(1, 60 - (now - round.started_at).seconds)`

Также отменяет pending kick:
```python
cache.delete(f"game:{game_id}:offline:{user_id}")
```

## Kick offline игрока

```
disconnect() во время IN_PROGRESS
  → cache.set(game:{id}:offline:{user_id}, 1, timeout=35)
  → kick_offline_player.apply_async(countdown=30)

kick_offline_player (через 30 сек):
  → если cache.get(offline_key) = None → игрок вернулся, skip
  → server.players.remove(user)
  → push player_left {user_id, kicked: True}
  → cache.delete(offline_key)

Фронт при player_left с kicked=True и user_id=me:
  → navigate("/main", {state: {error: "Вы были исключены из игры"}})
  → Main.tsx показывает .main-error-notification
```

## Таймлайн одного раунда

```
t=0     start_round → round_started
t=0     force_grade_round запланирован на t=65
t=30    таймер оверлей
t=15    таймер оверлей
t=3-1   таймер оверлей
t=60    фронт → round_end (каждый игрок)
t≤60    если все сдали → revoke → grade_round.delay()
t=65    force_grade_round (если не все сдали)
t+?     grade_round выполняется → round_results
t+?+10  start_round следующего раунда (или game_over)
```
