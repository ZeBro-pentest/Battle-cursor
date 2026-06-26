# Лог сессии: обновление README.md — 26.06.2026

## Что сделано

Обновлён [[README]] (`/README.md`) в корне проекта.

### Изменения в README

**Стек технологий**
- Добавлена строка: `Тесты | Playwright e2e + Allure (Newman для REST)`
- Уточнена строка почты: `Gmail SMTP (Mailtrap — только для локальных тестов)`

**Структура проекта**
- Добавлена директория `tests/frontend/e2e/` — Playwright тесты (auth, shop, profile)

**Запуск проекта**
- Заменены ручные команды (`celery -A config worker ...`) на make-команды из Makefile:
  - `make run`, `make build`, `make migrate`, `make celery`, `make celery-beat`, `make flower`, `make ngrok`, `make shell`, `make superuser`

**Переменные окружения — Backend**
- Mailtrap заменён на Gmail SMTP:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_HOST_USER=ваш@gmail.com
  EMAIL_HOST_PASSWORD=ваш-app-password
  EMAIL_USE_TLS=True
  ```
- `FRONTEND_URL=http://localhost:5173` уже присутствовал

**Переменные окружения — Frontend** (новый раздел)
- `VITE_API_URL=http://127.0.0.1:8000/`
- Вариант для ngrok: `VITE_API_URL=https://your-ngrok-url.ngrok-free.dev/`

**Запуск тестов** (новый раздел)
- Playwright: `npx playwright install chromium` → `npx playwright test`
- Allure: `npx allure serve ../allure-results`
- Newman: `cd tests && npm run test:run`

**Дата** обновлена на 25.06.2026

## Решения

- Mailtrap полностью убран из основных env vars — остаётся только как упоминание в стеке
- make-команды предпочтительнее прямых celery/daphne команд — единый интерфейс через Makefile

## Pending

- Фронтенд в процессе разработки
- Docker после завершения бэкенда
