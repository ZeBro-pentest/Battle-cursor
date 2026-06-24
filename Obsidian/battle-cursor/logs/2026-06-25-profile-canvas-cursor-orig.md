# Сессия 2026-06-25 — Profile canvas, cursor orig, CustomCursor

## Что сделано

### Backend

**[[users/models.py]]**
- Добавлено поле `image_orig = CloudinaryField("cursor_image_orig", null=True, blank=True)` в модель `Cursor`

**[[users/migrations/0008_add_cursor_image_orig.py]]**
- Миграция для нового поля

**[[users/serializers.py]]**
- `CursorSerializer` теперь отдаёт `image_orig_url` через `get_image_orig_url`

**[[users/management/commands/init_game_data.py]]**
- Читает `image_orig` из metadata.json
- Загружает файл `Name_cursor_orig.png` в Cloudinary с `public_id = Name_cursor_orig`
- Сохраняет в `cursor.image_orig`

**[[assets/images/metadata.json]]**
- Добавлено поле `"image_orig"` для всех 26 курсоров
- Паттерн: `Stylus_cursor.png` → `Stylus_cursor_orig.png`

---

### Frontend

**[[frontend/src/types/user.ts]]**
- Добавлено `image_orig_url: string | null` в интерфейс `Cursor`

**[[frontend/src/components/CustomCursor/CustomCursor.tsx]]**
- Обнулён (`return null`) — кастомный курсор перенесён локально на холст в Profile
- Убран из `App.tsx` / `RequireAuth`

**[[frontend/src/pages/Profile/Profile.tsx]]** — крупный рефактор

Новый layout (3 колонки `260px 1fr 220px`):
- **Левая** — профиль (никнейм, рейтинг/монеты, email, кнопка) + `// Снаряжение` + карточки курсора/холста
- **Центральная** — интерактивный холст с рамкой из `canvas.image_url` (`inset: -40px`)
- **Правая** — панель инструментов: палитра 4×4, color preview + HexColorPicker (react-colorful через Portal), слайдер кисти, кнопка ластика, кнопка очистить, подсказка Ctrl+Z

Логика рисования:
- `mousedown` → `saveHistory()` → начало штриха
- `mousemove` → продолжение линии
- `mouseup/leave` → завершение, сброс `globalCompositeOperation`
- Ластик: `destination-out`, размер `brushSize × 3`
- Undo: `e.code === "KeyZ"` (работает на любой раскладке), макс 20 шагов

Локальный курсор на холсте:
- `cursorImgRef` на `<img position: fixed>`
- Путь: `/images/cursors_orig/{cursor.name}_cursor_orig.png`
- Показывается только при `mouseenter` на canvas, скрывается при `mouseleave`
- Позиция обновляется через `ref.style` без React ре-рендера

**[[frontend/src/pages/Tutorial/Tutorial.tsx]]**
- Контент заменён на актуальный (лобби, раунды, Groq AI оценка, дебаффы, монеты/магазин)

---

## Решения

- **CORS и CSS cursor** — `cursor: url(cloudinary_url)` не работает т.к. браузер блокирует cross-origin для системного курсора. Решение: локальные файлы из `public/images/cursors_orig/`
- **Ctrl+Z раскладка** — `e.key === "z"` не работает на русской раскладке (`"я"`). Исправлено на `e.code === "KeyZ"`
- **Color picker portal** — `createPortal(popup, document.body)` чтобы попап не обрезался `overflow: hidden` родителя. Позиция вычисляется через `getBoundingClientRect()`
- **Canvas frame** — рамка холста через `<img>` с `inset: -40px` / `calc(100% + 80px)` поверх canvas (`z-index: 1`), canvas внизу (`z-index: 0`)
- **saveHistory в mousedown** — история сохраняется ДО штриха, чтобы Ctrl+Z корректно откатывал последнее действие

## Pending

- Файлы `*_cursor_orig.png` должны лежать в `frontend/public/images/cursors_orig/`
- Страница `/game/:id` — игровой canvas, дебаффы, таймер раунда (не реализовано)
- Docker — после завершения фронтенда
