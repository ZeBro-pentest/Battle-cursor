---
tags: [log]
---

# 2026-06-22 — Frontend static & Cloudinary

## Что сделано

### JWT access token
- `backend/config/settings.py` — `ACCESS_TOKEN_LIFETIME` уменьшен с 60 до 15 минут

### Django → React SPA
- `frontend/vite.config.ts` — добавлен `base: '/static/'` (без этого Vite генерирует пути `/assets/...` вместо `/static/assets/...`)
- `backend/config/settings.py` — добавлен `STATICFILES_DIRS = [BASE_DIR.parent / "frontend" / "dist"]` для подхвата сборки через `collectstatic`
- `backend/config/urls.py` — добавлен catch-all `serve_frontend` view (отдаёт `frontend/dist/index.html` для всех маршрутов кроме `api/`, `ws/`, `admin/`, `static/`) — нужен для React Router

### Исправление путей к изображениям
- `frontend/src/pages/Home/Home.tsx:150-151` — пути курсоров/канвасов исправлены на `/static/images/...`
- `frontend/src/components/Header/Header.tsx:7` — `/logo.png` → `/static/logo.png`

### Cloudinary upload
- Загружено 51 файл: 25 PNG (cursors), 25 SVG (canvas), logo.png
- Папка на Cloudinary: `battle-cursor/images/cursors/`, `battle-cursor/images/canvas/`, `battle-cursor/logo`
- Скрипт загрузки: `upload_to_cloudinary.py` (в корне проекта)
- Mapping создан: [[frontend/src/assets/cloudinary-images.json]] — 51 запись `filename → secure_url`
- `Home.tsx` — переключён на `cloudinaryImages[...]` через импорт JSON
- `Header.tsx` — logo берётся из `cloudinaryImages['logo.png']`

## Решения

- **SVG загружаются как `resource_type="image"`** — Cloudinary поддерживает SVG в image pipeline
- **`overwrite=False`** в скрипте загрузки — безопасное повторное использование без перезаписи
- **`as keyof typeof cloudinaryImages`** в Home.tsx — TypeScript type assertion для динамических ключей JSON

## Pending

- `npm install` + `npm run build` в `frontend/` (ранее упало на отсутствии `axios`)
- `python manage.py collectstatic` после сборки фронта
- Docker конфигурация
- e2e тесты (Playwright + Allure)
- Игровой экран (основная часть фронтенда)

---

## Связанные заметки

- [[architecture/decisions]] — стек, слоистость, статика под Daphne
- [[features/game-cycle]] — игровой цикл, фронтенд ещё не реализован
- [[data/models-game]] — Game, Round, Score
- [[features/groq-scoring]] — Groq оценка рисунков
- [[features/debuffs]] — система дебаффов
