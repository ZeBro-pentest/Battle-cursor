# 2026-06-26 — Docker config polish

## Что сделано

### backend/.dockerignore
Добавлены исключения для Celery Beat артефактов:
- `celerybeat-schedule`
- `celerybeat-schedule.db`
- `celerybeat.pid`

### docker-compose.yml
- `celery-beat`: команда обновлена — schedule-файл пишется в `/tmp/celerybeat-schedule` (избегаем конфликта прав в контейнере)
- `backend.environment`: добавлен `ALLOWED_HOSTS=localhost,127.0.0.1,backend,.ngrok-free.app,.ngrok-free.dev`

### Makefile (корень проекта)
Создан `/Makefile` с командами Docker-обёртками:
- `docker-build`, `docker-up`, `docker-down`, `docker-logs`
- `docker-migrate`, `docker-superuser`, `docker-shell`
- `ngrok` — запускает `ngrok http 80`

### frontend/nginx.conf
- Удалён блок `location /static/ { proxy_pass http://backend:8000; }` — статика отдаётся напрямую из `/usr/share/nginx/html`
- Добавлены алиасы для совместимости с путями Django `/static/assets/` → `/usr/share/nginx/html/assets/`
- Финальная структура: `/static/assets/` → alias assets, `/static/` → alias html root, `/` → SPA fallback

### README.md
- Добавлен раздел **"Быстрый старт (Docker)"** после описания проекта (шаги 1–6: клон, .env, установка Docker, сборка, init_game_data, ngrok)
- Раздел **"Запуск проекта"** переименован в **"Локальный запуск (без Docker)"**

## Решения

- **schedule в /tmp**: Celery Beat не может писать в `/app` если volume примонтирован read-only или с ограниченными правами — `/tmp` всегда writable
- **ALLOWED_HOSTS в env, не в settings.py**: `backend` как хост нужен только в Docker-контексте, не в локальном dev; `settings.py` уже читает через `decouple.config()`
- **nginx alias вместо proxy_pass для статики**: Vite кладёт файлы в `dist/assets/`, но старый код фронта мог делать запросы на `/static/assets/` — alias решает без переписывания JS

## Pending

- Проверить, что фронт корректно запрашивает статику (нет ли хардкода `/static/` в JS)
- `init_game_data` — убедиться что management command существует и отработает в Docker
- Рассмотреть health check для `backend` в docker-compose (сейчас celery стартует без гарантии что backend готов)

## Изменённые файлы

- [[backend/.dockerignore]]
- [[docker-compose.yml]]
- [[Makefile]]
- [[frontend/nginx.conf]]
- [[README.md]]
