# WebSocket — GameConsumer

Файл: `backend/servers/consumers.py`

## Подключение

```
ws://host/ws/game/<room_code>/?token=<JWT>
```

`JWTAuthMiddleware` декодирует токен → `scope["user"]`. Если не авторизован → `close(4001)`.

### Коды закрытия
| Код | Причина |
|-----|---------|
| 4001 | Не авторизован |
| 4003 | Не в комнате |
| 4004 | Комната не найдена |

## connect()

1. Проверка авторизации, server existence, player membership
2. `set_online(True)` → `user:{id}:online` TTL=20s
3. `group_add` + `accept()`
4. Если хост переподключился → удалить `server:{room_code}:host_disconnected`
5. Если игра в процессе → удалить `game:{id}:offline:{user_id}` (отмена kick)
6. `group_send` → `player_joined`
7. `get_current_game_state()` → если есть активная игра → `send(game_state_sync)`

### game_state_sync payload
```json
{
  "type": "game_state_sync",
  "game_id": "uuid",
  "round_id": "uuid",
  "round_number": 1,
  "prompt": "...",
  "time_left": 42,
  "total_rounds": 3,
  "used_debuffs": ["blur"],
  "player_scores": {"uuid": 12.5},
  "round_history": [{"round_number": 1, "prompt": "...", "scores": [...]}]
}
```
`time_left` = max(1, 60 - elapsed_since_started_at)

## disconnect()

**Статус WAITING:**
- Хост → grace period 30s: `cache.set(server:{room_code}:host_disconnected)` + `delete_server_if_host_absent.apply_async(countdown=10)`
- Игрок → `leave_server()` немедленно

**Статус IN_PROGRESS:**
- `cache.set(game:{id}:offline:{user_id}, 1, timeout=35)`
- `kick_offline_player.apply_async(countdown=30)`

**После завершённой игры (self.game_id установлен):**
- `cleanup_game.delay(game_id, room_code)` — идемпотентный

`group_send` → `player_left` в любом случае.

## receive() — обработчики событий

### Клиент → Сервер
| type | handler | описание |
|------|---------|----------|
| `cursor_move` | `handle_cursor_move` | x, y, cursor_id |
| `draw` | `handle_draw` | stroke data |
| `ping` | `handle_ping` | → pong |
| `game_start` | `handle_game_start` | только хост |
| `round_end` | `handle_round_end` | round_id, image_base64 |
| `debuff_apply` | `handle_debuff_apply` | debuff_id, target_id |
| `debuff_solved` | `handle_debuff_solved` | debuff_id, user_id |

### handle_game_start
- Проверка что sender = host
- `ServerService.start_game()` → Game + Rounds (промпты от Groq на русском)
- `cache.set(game:{id}:players_count)`
- `group_send` → `game_start`
- `start_round.delay(first_round_id, game_id, room_group)`

### handle_round_end
- Сохраняет рисунок в Redis: `round:{id}:drawing:{user_id}` TTL=300s
- Атомарный счётчик `round:{id}:submitted`
- Если submitted >= players_count → `cancel_force_task()` → `grade_round.delay()`

### handle_debuff_apply
Цепочка проверок:
1. target_id != self.user.id (нельзя себе)
2. debuff существует в DEBUFFS
3. game_id и current_round_id из БД
4. `game:{id}:used_debuff:{user_id}:{debuff_id}` — не использован в этом раунде
5. `game:{id}:debuff_active:{target_id}` — у цели нет активного
6. Атакующий имеет дебафф в курсоре (`user_has_debuff`)
7. Mirror: если у цели mirror в курсоре → reflect на sender
8. Protection: если у цели защита канваса → `debuff_protected` (первый раз за раунд)
9. Ставит `debuff_active` (TTL=5 для LEGENDARY, TTL=duration для обычных)
10. `cache.set(used_debuff)` TTL=70s
11. `group_send` → `debuff_received`

### Сервер → Клиент (group events)
| type | описание |
|------|----------|
| `player_joined` | новый игрок |
| `player_left` | игрок вышел; `kicked: true` если кик |
| `cursor_update` | позиция курсора |
| `draw_update` | штрих рисования |
| `pong` | ответ на ping |
| `game_start` | игра началась |
| `round_started` | раунд начался |
| `round_results` | результаты раунда |
| `game_over` | игра завершена |
| `debuff_received` | дебафф применён к target |
| `debuff_reflected` | mirror отразил дебафф обратно |
| `debuff_blocked` | защита канваса сработала |
| `debuff_solved` | дебафф решён (broadcast) |
| `server_deleted` | сервер удалён (хост ушёл) |

## Вспомогательные методы

- `get_current_game_state()` — полный state для reconnect
- `get_current_round_id(game_id)` — первый незавершённый Round
- `user_has_debuff(debuff_id)` — проверка cursor.debuffs
- `target_has_debuff(target_id, debuff_id)` — mirror check
- `get_target_protections(target_id)` — canvas.protections
- `cancel_force_task(round_id)` — revoke Celery task по task_id из Redis
