# 2026-06-30 — WS debuff fixes + code review

## Что сделано

### WebSocket надёжность (Game.tsx)

- Добавлена функция `sendWS(data)` — единая точка отправки WS с проверкой `readyState === OPEN` и `console.warn` при дропе
- Все прямые `wsRef.current?.send(JSON.stringify(...))` заменены на `sendWS({...})`: `handleApplyDebuff`, `sendCursorMove`, `removeEffect`, ping interval, round_end effect
- Добавлен debounce 500мс (`lastApplyTimeRef`) и проверка `readyState` в начале `handleApplyDebuff` — защита от спама Space при закрытом соединении

### Защита от гонки round_id (backend + frontend)

- **Backend** (`servers/consumers.py`): добавлен метод `get_current_round_id(game_id)` — запрашивает первый незавершённый раунд (`is_finished=False`, `order_by("number").first()`)
- В `handle_debuff_apply` `round_id` передаётся в оба `group_send` (основной и mirror-отражение)
- **Frontend** (`Game.tsx`): в `debuff_received` добавлена проверка `round_id` — дебаффы из старого раунда игнорируются с `console.warn`
- Исправлена ошибка в guard: `if (round_id && roundRef.current && roundRef.current.round_id !== round_id)` — при null roundRef (до game_state_sync) дебафф не дропается

### Логирование (consumers.py)

- `connect()`: `logger.info("WS connect: user=%s (%s) room=%s channel=%s", ...)`
- `handle_debuff_apply`: два лога — полный `data` и `game_id + current_round_id + debuff`
- `get_current_round_id`: лог `game_id → round_id`

---

## Code Review — найденные и исправленные баги (10 штук)

### Критичные

**#1 `Game.tsx:329` — removeEffect стирал чужие дебафф-индикаторы**
- Было: `key.endsWith('_blur')` удалял ВСЕ ключи с таким суффиксом
- Стало: `next.delete(\`${profileRef.current?.id}_${debuffId}\`)` — точное удаление

**#2 `tasks.py:208` — coin writes вне транзакции**
- Было: `cache.set(coin_key)` выполнялось ПОСЛЕ `transaction.atomic()`, `game_over` мог сработать раньше при краше воркера
- Стало: coin writes перенесены ВНУТРЬ `transaction.atomic()` блока

**#3 `Game.tsx:458` — round_id guard ломался при null roundRef**
- Было: `roundRef.current?.round_id !== round_id` при null давало `undefined !== id = true` → дроп валидного дебаффа
- Стало: явная проверка `roundRef.current &&` перед сравнением

### Высокие

**#4 `services.py:69` — cache.delete внутри транзакции**
- Было: `cache.delete(coin_key)` в цикле внутри транзакции — при откате Redis ключи терялись безвозвратно
- Стало: `transaction.on_commit(lambda: cache.delete_many(keys_to_delete))`

**#5 `consumers.py:344` — used_debuff TTL утекал в следующий раунд**
- Было: ключ `game:{id}:used_debuff:{user}:{debuff}` с timeout=70 переживал старт нового раунда (65-70с)
- Стало: в `start_round` очистка всех `used_debuff:*` через `cache.iter_keys` + `cache.delete_many`

**#6 `tasks.py:121` — пустые drawings продвигали раунд**
- Было: `if not drawings: logger.warning(...)` — раунд завершался с нулевыми очками
- Стало: добавлен `return` — раунд не продвигается без рисунков

**#7 `tasks.py:241` — TOCTOU race, двойной grade_round**
- force_grade_round мог запустить второй grade_round если первый не успел записать is_finished до проверки
- Стало: Redis lock `round:{round_id}:grading_lock` (timeout=120) — второй вызов пропускается

### Средние / низкие

**#8 `services.py:62` — falsy-zero check**
- Было: `if redis_coins:` пропускал 0.0 как False
- Стало: `if redis_coins is not None:`

**#9 `services.py:80` — порог рейтинга `max_coins >= 100` недостижим**
- В 2-player игре max = 100 только при идеальных 5.0 за все раунды
- Стало: `if winner_id:` — рейтинг начисляется любому победителю

**#10 `tasks.py:32,44` — `cache.keys()` блокирует Redis (O(N) KEYS)**
- Все вхождения `cache.keys()` заменены на `cache.iter_keys()` (SCAN-based, неблокирующий)

---

## Принятые решения

- `sendWS` как `useCallback([])` — refs стабильны, функция стабильна, все useCallback зависимости обновлены
- `cache.iter_keys()` вместо SCAN напрямую — django-redis поддерживает нативно, не нужен raw клиент
- Coin writes внутри транзакции (не через on_commit) — синхронно с записью Score, risk малый (Redis операции быстрые)
- Убран порог max_coins, но логика winner через max_coins оставлена (не first place, а most coins)

---

## Pending / не сделано

- Параллельные Cloudinary + Groq запросы (8 serial HTTP calls) — не реализовано, TODO
- `roundHistory` state write-only (используется только ref) — мелкий cleanup, не критично
- `LEGENDARY_DEBUFFS` дублируется в consumers.py и Game.tsx — нужна единая константа
- e2e тесты дебаффов через Playwright

---

## Изменённые файлы

- [[frontend/src/pages/Game/Game.tsx]]
- [[backend/servers/consumers.py]]
- [[backend/ai/tasks.py]]
- [[backend/game/services.py]]
