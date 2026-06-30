# 2026-06-29 — Game mechanics polish, kick logic, null-duration debuffs

## Что сделано

### EraserEffect — визуальный оверлей без ctx

- `frontend/src/components/debuffs/effects/EraserEffect.tsx` — полностью переписан
- Убраны `ctx.clearRect` / `ctx.fillRect` — canvas не трогается
- Кружок движется через `requestAnimationFrame` + отталкивание от стен
- CSS: `.effect-eraser-overlay` + `.effect-eraser-circle` вместо `.effect-eraser`
- **Причина:** `canvas.toDataURL()` при `round_end` должен содержать только рисунок игрока

### Кик офлайн игроков

**`backend/servers/consumers.py`**
- `disconnect()`: при статусе `IN_PROGRESS` ставит Redis-ключ `game:{id}:offline:{user_id}` TTL=35 и запускает `kick_offline_player` countdown=30
- `connect()`: удаляет offline-ключ по `server.game_id` при переподключении (инстанс consumer всегда стартует без `game_id`)

**`backend/ai/tasks.py`** — новый таск `kick_offline_player`:
- Проверяет Redis-ключ офлайна, удаляет игрока из `server.players`, пушит `player_left` с `kicked=True`

**`backend/servers/tasks.py`** — новый таск `cleanup_offline_waiting_players`:
- Каждые 30 сек (Beat) проверяет `user:{id}:online` для всех игроков WAITING-серверов и кикает офлайн

**`backend/config/settings.py`**:
- Добавлен `cleanup-offline-waiting-players` в `CELERY_BEAT_SCHEDULE`, `schedule: 30.0`

**`frontend/src/pages/Game/Game.tsx`**:
- `player_left` handler: читает `kicked?: boolean`, показывает уведомление "исключён за отсутствие"

### Null-duration дебаффы (puzzle и подобные)

**Новая логика:**
- Backend (`consumers.py`): null-duration дебаффы НЕ ставят `debuff_active` Redis-ключ → цель не блокируется от новых дебаффов
- Frontend (`Game.tsx`): null-duration НЕ добавляются в `activeTargetDebuffs` → нет замка 🔒
- Frontend: атакующий получает перезарядку 5 сек (снимается с `usedDebuffs` через setTimeout 5000мс)
- Визуальный эффект крутится бесконечно до `round_started`

| | Обычный | Null-duration |
|---|---|---|
| Backend block | duration сек | нет |
| Замок | да | нет |
| Перезарядка | раунд | 5 сек |
| Бейдж на карточке | исчезает через duration | до round_started |

### Очки и места на карточках игроков (Game.tsx)

- Добавлен `playerScores: Record<string, number>` — накапливается из каждого `round_results`
- Ранги вычисляются перед рендером: сортировка по убыванию очков → `rankMap`
- Вместо монет и рейтинга: очки (белый 13px benzin) + место (красный акцент 9px)
- CSS: `.game-player-score`, `.game-player-rank`, `.game-player-waiting`

### Мелкие CSS/UI правки

- `.game-debuff-apply-btn`: `font-size: 11px → 9px`
- `.game-player-card-frame`: `top/left: -6px → 0`, `100%x100%` (по размеру карточки)
- `.game-notification`: центрирована, красная рамка, benzin 16px, анимация появления
- `ai/config.py`: улучшен `PROMPT_GENERATION_PROMPT` (категории, разнообразие)
- `ai/services.py`: `temperature: 0.9 → 1.0` для генерации промптов
- Цвет mythic: `#ff8800 → #FF0606` в `Inventory.tsx` и `ProfileDetail.tsx`
- Рамки по редкости на карточках инвентаря: `.inventory-card-rarity`

## Решения

- `server.game_id` вместо `self.game_id` в `connect()` — т.к. consumer инстанс всегда стартует с `game_id = None`
- Null-duration: не блокировать через Redis, не показывать замок, перезарядка через setTimeout 5000мс
- EraserEffect: RAF-анимация позиции через DOM `style.left/top`, без касания canvas

## Pending

- Ничего явного

## Изменённые файлы

- [[EraserEffect.tsx]]
- [[DebuffOverlay.css]]
- [[consumers.py]]
- [[ai/tasks.py]]
- [[servers/tasks.py]]
- [[settings.py]]
- [[Game.tsx]]
- [[Game.css]]
- [[Inventory.tsx]]
- [[ProfileDetail.tsx]]
- [[ai/config.py]]
- [[ai/services.py]]
