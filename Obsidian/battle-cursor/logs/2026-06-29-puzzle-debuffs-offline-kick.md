# 2026-06-29 — PuzzleEffect, null-duration debuffs, offline kick, CSS polish

## Что сделано

### frontend/src/components/debuffs/effects/PuzzleEffect.tsx (создан)

- Интерактивный пазл из цифр 1–9 в случайном порядке
- Нужно нажимать числа строго по возрастанию: 1, 2, 3, ... 9
- Неверный клик игнорируется; верный — ячейка становится зелёной
- После нажатия 9 → `setTimeout(onComplete, 500)` → эффект снимается, рисование разблокируется
- `shuffle()` — Fisher-Yates
- Пока `puzzle` активен: в `onMouseDown` добавлена проверка `activeEffectsRef.current.has("puzzle")`

### frontend/src/components/debuffs/DebuffOverlay.css

- Удалён старый `.effect-puzzle` (6-колонная сетка)
- Добавлены стили: `.effect-puzzle-overlay`, `.effect-puzzle-box`, `.effect-puzzle-grid`, `.effect-puzzle-cell`, `.effect-puzzle-cell--next` (пульсирует), `.effect-puzzle-cell--done` (зелёный)

### frontend/src/components/debuffs/effects/EraserEffect.tsx (переписан)

- **Раньше**: `ctx.clearRect()` / `ctx.fillRect()` — портило холст игрока
- **Теперь**: чисто визуальный эффект на RAF — анимированный кружок (`.effect-eraser-circle`) движется по `style.left/top` и отскакивает от границ
- Canvas игрока не трогается, `toDataURL()` при `round_end` остаётся чистым

### frontend/src/pages/Game/Game.tsx

#### null-duration дебаффы

- `debuff_received` handler: `duration: number | null`
- Null-duration дебаффы (`puzzle`, `eraser`): **не** добавляются в `activeTargetDebuffs` → замок у цели не появляется
- Null-duration `activeDebuffs` badge не удаляется по timeout (живёт до `round_started`)
- `round_started`: `setActiveDebuffs({})` — сбрасывает все дебаффы

#### Дебаффы — одноразовые (без перезарядки)

- Убран `setTimeout(() => setUsedDebuffs(prev => ...), 5000)` для null-duration дебаффов
- Все дебаффы одноразовые за раунд без исключений

#### Очки и место на карточке игрока

- `playerScores: Record<string, number>` — аккумулируется из `round_results`
- `rankMap` — сортировка по очкам перед рендером
- Карточка: показывает `score` (белый) и `rank` (красный `var(--accent)`) вместо монет/рейтинга

#### Chill замедляет на 70%

- `onMouseDown` и `onCanvasMouseMove`: скорость `* 0.8` → `* 0.3` (70% замедления)

### frontend/src/pages/Game/Game.css

- `.game-canvas-top`: `flex-direction: column; align-items: center; gap: 4px; padding: 0 8px`
- `.game-canvas-prompt`: `var(--font-benzin); font-size: 16px; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- `.game-canvas-score`: `var(--mono); font-size: 12px; letter-spacing: 2px; color: #888`
- `.game-player-rank`: `var(--font-benzin); font-size: 11px; color: var(--accent)`
- `.game-player-score`: `var(--font-benzin); font-size: 13px; color: #fff`

### backend/servers/consumers.py

- `connect()`: удаляет Redis ключ `game:{id}:offline:{user_id}` если game активна (переподключение)
- `disconnect()`: при `IN_PROGRESS` — ставит Redis `game:{id}:offline:{user_id}` TTL=35, запускает `kick_offline_player.apply_async(countdown=30)`

### backend/ai/tasks.py

- Новая задача `kick_offline_player(game_id, room_group, user_id, room_code)`:
  - Проверяет Redis ключ `game:{id}:offline:{user_id}`
  - Если ключ есть → убирает игрока из `server.players`, пушит `player_left` с `kicked=True`

### backend/servers/tasks.py (создан)

- `cleanup_offline_waiting_players()`: каждые 30 сек кикает офлайн игроков из WAITING комнат

### backend/config/settings.py

- `CELERY_BEAT_SCHEDULE`: добавлена задача `cleanup-offline-waiting-players` каждые 30 сек

## Решения

- **EraserEffect без ctx**: RAF-анимация перемещает DOM-элемент `.effect-eraser-circle`, холст не трогается
- **Null-duration не блокируют цель**: backend не ставит `debuff_active` ключ, frontend не добавляет в `activeTargetDebuffs`
- **Пазл блокирует рисование**: `activeEffectsRef.current.has("puzzle")` в `onMouseDown`
- **Переподключение**: `connect()` чистит offline ключ — таск не кикнет вернувшегося игрока

---

## Аудит дебаффов: реализовано и остаётся

### Паттерны реализации

| Паттерн | Примеры | Как работает |
|---------|---------|--------------|
| **CSS overlay** | tar, smudge, static, flash, advertising | Компонент рендерит `<div>` с CSS-анимацией поверх холста |
| **DOM manipulation** | carousel, shake, zoom, collapse | `useEffect` меняет `style.animation` / классы на элементах страницы |
| **Canvas filter** | blur, darkness | `getCanvasStyle()` из `BlurEffect.tsx` → `style.filter` на `<canvas>` в Game.tsx |
| **pointer-events: none** | freeze | `canvas.style.pointerEvents = "none"` — мышь не проходит |
| **SVG overlay** | vandal | Статичный SVG с линиями трещин поверх холста |
| **RAF animation** | eraser | `requestAnimationFrame` двигает DOM-элемент, холст не трогается |
| **Интерактивный overlay** | captcha, popup, blocking, puzzle | Блокирующий оверлей с UI; `onComplete` callback снимает эффект |
| **Логика в Game.tsx** | chill, anonim, palette_swap, timer | Нет компонента-эффекта; логика встроена прямо в обработчики Game.tsx |

---

### COMMON (15 дебаффов)

| ID | Реализован | Как |
|----|-----------|-----|
| `chill` | ✅ | Game.tsx: `* 0.3` в `onMouseDown` + `onCanvasMouseMove` |
| `blur` | ✅ | BlurEffect.tsx `getCanvasStyle()` → `filter: blur(4px)` |
| `tar` | ✅ | TarEffect: 3 дымовых div с CSS-анимацией |
| `smudge` | ✅ | SmudgeEffect: один div `.effect-smudge` с кляксой |
| `weight` | ❌ | — курсорная инерция, не реализована |
| `static` | ✅ | StaticEffect: 2 div-слоя с полосами помех |
| `carousel` | ✅ | CarouselEffect: `animation: carousel-spin` на wrapper холста |
| `flash` | ✅ | FlashEffect: div с CSS-анимацией вспышки; `onAnimationEnd → onComplete` |
| `eraser` | ✅ | EraserEffect: RAF-анимация кружка, отскакивает от краёв |
| `anonim` | ✅ | AnonimEffect: null-компонент; Game.tsx прячет имена и курсоры |
| `mirror` | ❌ | — отражение дебаффа на атакующего, не реализован |
| `advertising` | ✅ | AdvertisingEffect: 3 фейк-баннера с позиционированием |
| `palette` | ❌ | — смена цвета кисти (отличается от `palette_swap`) |
| `captcha` | ✅ | CaptchaEffect: чекбокс + таймер 30с; пульсирует в красном при urgency |
| `darkness` | ✅ | DarknessEffect: null-компонент; `getCanvasStyle()` → `brightness(0.05)` |

### RARE (10 дебаффов)

| ID | Реализован | Как |
|----|-----------|-----|
| `collapse` | ✅ | CollapseEffect: `.game-header`, `.game-debuffs`, `.game-tools` падают через CSS |
| `vandal` | ✅ | VandalEffect: SVG трещины поверх холста |
| `shake` | ✅ | ShakeEffect: `animation: shake` на `.game-page` |
| `zoom` | ✅ | ZoomEffect: класс `.effect-zoom-active` на wrapper → CSS transform scale |
| `quickly` | ❌ | — ускорение курсора, не реализовано |
| `popup` | ✅ | PopupEffect: фейк-окно «системное сообщение»; кнопка OK → onComplete |
| `timer` | ✅ | TimerEffect: null-компонент; Game.tsx рендерит таймер `* 3` визуально |
| `palette_swap` | ✅ | PaletteSwapEffect: null-компонент; `debuff_received` → `setColor(random)` |
| `blocking` | ✅ | BlockingEffect: прогресс-бар 1.2с → ошибка + кнопка «Повторить» |
| `freeze` | ✅ | FreezeEffect: `canvas.style.pointerEvents = "none"` |

### EPIC (10 дебаффов)

| ID | Реализован | Как |
|----|-----------|-----|
| `riddle` | ❌ | — загадка с вводом ответа |
| `puzzle` | ✅ | PuzzleEffect: 3×3 сетка цифр 1–9 в случайном порядке, нажимать по порядку |
| `quiz` | ❌ | — вопрос с вариантами ответа |
| `code` | ❌ | — показать код, ввести в поле |
| `maze` | ❌ | — провести курсор через лабиринт |
| `agreement` | ❌ | — прочитать соглашение, нажать «Принять» |
| `survey` | ❌ | — короткий опрос |
| `password` | ❌ | — запомнить пароль (1 сек) и ввести |
| `scan` | ❌ | — фейковая проверка безопасности с прогресс-баром |
| `verify` | ❌ | — капча типа «кликни на все светофоры» |

### MYTHIC (10 дебаффов — все аудио)

Все 10 не реализованы: `siren`, `hiss`, `echo`, `pyhindu`, `ringtone`, `whisper`, `glitch`, `storm`, `zombie`, `bombs`. Требуют Audio API + звуковые файлы.

### LEGENDARY (10 дебаффов — все сложные)

Все 10 не реализованы: `questions`, `exam`, `weighting`, `weapons`, `rickroll`, `disco`, `transparency`, `brightness`, `roulette`, `dvd`. Требуют нетривиальной игровой логики.

---

### Итог

- **Реализовано**: 22 из 55 дебаффов (40%)
- **Не реализовано**: 33 (3 COMMON, 2 RARE, 9 EPIC, 10 MYTHIC, 10 LEGENDARY)
- **Приоритет**: EPIC-дебаффы (`scan`, `agreement`, `quiz`, `code`) — простые интерактивные оверлеи, легко добавить по паттерну CaptchaEffect / PopupEffect

---

## Pending

- Ничего явного

## Изменённые файлы

- [[PuzzleEffect.tsx]]
- [[EraserEffect.tsx]]
- [[DebuffOverlay.css]]
- [[Game.tsx]]
- [[Game.css]]
- [[consumers.py]]
- [[ai/tasks.py]]
- [[servers/tasks.py]]
- [[settings.py]]
