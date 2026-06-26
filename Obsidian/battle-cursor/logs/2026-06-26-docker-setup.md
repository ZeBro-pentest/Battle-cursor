# 2026-06-26 — Docker setup

## Что сделано

### Makefile
- Добавлены Docker make-команды в [[backend/Makefile]]: `docker-build`, `docker-up`, `docker-down`, `docker-logs`, `docker-migrate`, `docker-superuser`, `docker-shell`

### Docker файлы (все новые)
- [[docker-compose.yml]] в корне — 5 сервисов: redis, backend, celery, celery-beat, frontend
- [[backend/Dockerfile]] — python:3.12-slim, WORKDIR /app, pip install + COPY
- [[frontend/Dockerfile]] — multi-stage: node:20-alpine (build) → nginx:alpine (serve)
- [[frontend/nginx.conf]] — SPA fallback + proxy `/api/`, `/ws/`, `/static/` → backend:8000
- [[backend/.dockerignore]] — исключает .venv, .env, db.sqlite3, staticfiles/
- [[frontend/.dockerignore]] — исключает node_modules, dist, .env*

### Фикс Redis URL
- В `backend/.env` все Redis-хосты указаны как `localhost` (нужно для локалки)
- `.env` не изменялся — в [[docker-compose.yml]] добавлен блок `environment:` для backend, celery, celery-beat с переопределением:
  ```
  REDIS_URL=redis://redis:6379/0
  CELERY_BROKER_URL=redis://redis:6379/0
  CELERY_RESULT_BACKEND=redis://redis:6379/1
  ```
- `environment:` имеет приоритет над `env_file:` — localhost перекрывается при запуске в Docker

## Решения

- **Redis URL override в compose, не в .env** — `.env` остаётся рабочим для локальной разработки без Docker. Переключение прозрачное.
- **VITE_API_URL=/** по умолчанию в frontend/Dockerfile — фронтенд шлёт запросы на тот же origin, nginx проксирует `/api/` → backend:8000. Не нужно прописывать хост бэкенда в env.
- **WebSocket proxy** — `/ws/` в nginx.conf с `proxy_http_version 1.1` и `Upgrade` заголовками. Обязательно для Django Channels.
- **db.sqlite3 как отдельный volume** — `./backend/db.sqlite3:/app/db.sqlite3` монтируется явно, чтобы данные не терялись при пересборке образа.

## Pending

- Страница `/game/:id` — игровой canvas, дебаффы, таймер раунда (не начато)
- Проверить Docker build на чистой машине (`docker compose up --build`)
