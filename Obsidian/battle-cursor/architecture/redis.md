# Redis — ключи и использование

## БД конфигурация
- **DB 0** — channel layer (Django Channels) + Celery broker
- **DB 1** — cache (django-redis): всё описанное ниже

## Ключи

### Онлайн статус
| Ключ | Значение | TTL |
|------|----------|-----|
| `user:{id}:online` | 1 | 20s |

Обновляется при каждом `receive()` (keep-alive).

### Игровое состояние
| Ключ | Значение | TTL |
|------|----------|-----|
| `game:{id}:players_count` | int | 3600s |
| `game:{id}:coins:{user_id}` | float | 3600s |
| `game:{id}:offline:{user_id}` | 1 | 35s |

`players_count` устанавливается один раз при `game_start`, не меняется.
`coins` накапливаются в `grade_round`, синхронизируются в БД только в `game_over`.

### Раунд
| Ключ | Значение | TTL |
|------|----------|-----|
| `round:{id}:drawing:{user_id}` | `{image_base64, image_url}` | 300s |
| `round:{id}:submitted` | int (счётчик) | 300s |
| `round:{id}:task_id` | Celery task ID | 120s |
| `round:{id}:grading_lock` | 1 | 120s |

`grading_lock` — mutex для `grade_round`, предотвращает двойной запуск.

### Дебаффы
| Ключ | Значение | TTL |
|------|----------|-----|
| `game:{id}:debuff_active:{user_id}` | debuff_id | duration (обычные) / 5s (LEGENDARY) |
| `game:{id}:used_debuff:{user_id}:{debuff_id}` | 1 | 70s |
| `game:{id}:protection_used:{target_id}:{debuff_id}` | 1 | 70s |

`debuff_active` блокирует цель от получения другого дебаффа.
`used_debuff` — одноразовость применения за раунд.
`protection_used` — защита канваса срабатывает один раз за раунд.

Все `debuff_active` и `used_debuff` очищаются в `start_round` перед push `round_started`.

### Серверные
| Ключ | Значение | TTL |
|------|----------|-----|
| `server:{room_code}:host_disconnected` | 1 | 30s |

Grace period для хоста. Если хост переподключится до истечения → ключ удаляется.

## Паттерны работы

### Итерация ключей
Используется `cache.iter_keys(pattern)` (SCAN-based, неблокирующий) вместо `cache.keys()` (O(N) KEYS).

### Атомарные операции
```python
cache.add(key, 0, timeout=TTL)  # создать только если нет
cache.incr(key)                  # атомарный инкремент
```
Используется для счётчика submitted.

### Удаление после коммита
```python
transaction.on_commit(lambda: cache.delete_many(keys_to_delete))
```
Для coin-ключей: не удаляем до успешного коммита в БД.

## Чистка после игры

`game_over`:
- `cache.delete(game:{id}:players_count)`
- `cache.delete_many(game:{id}:debuff_active:*)`

`cleanup_game` (когда все отключились):
- `cache.delete_many(game:{id}:*)`

`_cleanup_round` (в grade_round):
- Удаляет все `round:{id}:drawing:*`, `task_id`, `submitted`
