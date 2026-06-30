# 2026-06-29 — Game UI polish, canvas frames, inventory rarity

## Что сделано

### frontend/src/pages/Game/Game.tsx

- Добавлено поле `canvas: { image_url: string | null } | null` в `GamePlayer`
- Все места обогащения игроков (`getServer`, `getProfileById`, `profile` useEffect, `player_joined` WS) теперь сохраняют `canvas: up.canvas`
- В рендере карточки игрока добавлен `<img className="game-player-card-frame">` если есть `canvas.image_url`
- Контент карточки обёрнут в `.game-player-card-content` с `z-index: 3` — поверх фрейма
- Исправлен TypeScript баг: в `player_joined` при создании нового игрока не было `canvas: null`
- Исправлена логика замков на дебаффах: `targetHasActiveDebuff` вычисляется один раз для текущей цели (через `currentTarget` / `currentTargetId`), замок показывается на ВСЕХ дебаффах если у цели активен хоть один

### frontend/src/pages/Game/Game.css

- `.game-player-card`: уменьшен до `80–100px`, `padding: 6px`, добавлен `background: #1e1e1e → #1a1a1a`, `border-radius: 6px`
- `.game-player-card-frame`: выходит за край на `-6px` (было `-12px` → `-8px` → `-6px`)
- `.game-player-card-content`: новый `position: relative; z-index: 3`
- `.game-player-card--selected`: теперь `border-color: var(--accent)` + красное свечение
- `.game-header`: `background: #0b0b0b`, `border: #1a1a1a`, логотип и таймер — `var(--font-benzin)`
- `.game-header-title`: цвет `var(--accent)` (красный)
- `.game-header-timer--urgent`: `var(--accent)` вместо `#ff4444`
- `.game-debuffs` / `.game-tools`: `background: #111`, `border: 1px solid #1a1a1a`, `border-radius: 6px`
- `.game-debuff-item`: `background: #0f0f0f`, без синего selected
- `.game-debuff-apply-btn`: прозрачная, красная рамка, `var(--font-benzin)`
- `.game-eraser-btn`: прозрачная, активная — жёлтая
- `.game-clear-btn`: прозрачная, красная рамка при hover
- `.game-canvas-prompt`: `var(--font-benzin)`
- `.game-section-label`: `var(--accent)`, opacity 0.5, `letter-spacing: 5px`
- `.game-notification`: переделана — центрирована по горизонтали, `top: 80px`, красная рамка, `var(--font-benzin)` 16px, анимация `notification-appear`

### backend/ai/config.py

- `PROMPT_GENERATION_PROMPT` — переписан: требует разные категории (животные, еда, космос, мифические места и т.д.), запрещает похожие темы, миксует простые и необычные

### backend/ai/services.py

- `generate_prompts`: `temperature` поднята до `1.0` для максимальной случайности

### frontend/src/pages/Inventory/Inventory.tsx

- `InvCard` получает `rarity` prop
- `RARITY_BORDER` map: common → #555, rare → #4488ff, epic → #aa44ee, mythic → #FF0606, legendary → #ffcc00
- Карточка окрашивается рамкой и свечением по редкости
- Текст редкости под названием: `.inventory-card-rarity`

### Исправление мифической категории

- `Inventory.tsx`: mythic `#ff8800` → `#FF0606`
- `ProfileDetail.tsx`: mythic `#ff8800` → `#FF0606`
- Везде (Shop, ShopItemDetail, PlayerCard, Main, Profile, debuffs) уже было `#FF0606`

### frontend/src/pages/Inventory/Inventory.css

- Добавлен `.inventory-card-rarity`: `var(--font-benzin)`, 9px, `letter-spacing: 2px`, uppercase

## Решения

- Фрейм холста на карточке игрока — абсолютный `img` с `overflow: visible` на карточке
- `z-index` контента карточки (`z-index: 3`) поверх фрейма (`z-index: 2`)
- Замки на дебаффах — одна проверка `targetHasActiveDebuff` для всей строки, а не per-debuff

## Pending

- Ничего явного не осталось

## Изменённые файлы

- [[Game.tsx]]
- [[Game.css]]
- [[Inventory.tsx]]
- [[Inventory.css]]
- [[ai/config.py]]
- [[ai/services.py]]
- [[ProfileDetail.tsx]]
