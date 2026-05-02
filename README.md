# Battle-sursor

Фуллстак веб-приложение онлайн игры ...

> Сюжет еще в разработке

## Структура проекта

```
📦Battle-cursor
┣ 📂backend
┃ ┣ ⚙️config         # settings не настроен пока-что
┃ ┣ 📂templates      # в разработке
┃ ┣ 📂users          # в разработке
┃ ┣ 📂game           # в разработке
┃ ┣ 📂market         # в разработке
┃ ┣ 🔧.gitignore
┃ ┣ 🔧requirements.txt
┃ ┗ 📜manage.py
┣ 📂frontend
┃ ┣ 📂public
┃ ┃ ┣ 📜favicon.svg
┃ ┃ ┗ 📜icons.svg
┃ ┣ 📂src
┃ ┃ ┣ 📂assets
┃ ┃ ┣ 📂api          # в разработке
┃ ┃ ┣ 📂components   # в разработке
┃ ┃ ┣ 📂features     # в разработке
┃ ┃ ┣ 📂pages        # в разработке
┃ ┃ ┣ 📂store        # в разработке
┃ ┃ ┣ 📜App.css
┃ ┃ ┣ 📜App.tsx
┃ ┃ ┣ 📜index.css
┃ ┃ ┗ 📜main.tsx
┃ ┣ 📜.gitignore
┃ ┣ 📜eslint.config.js
┃ ┣ 📜index.html
┃ ┣ 📜package-lock.json
┃ ┣ 📜package.json
┃ ┣ 📜tsconfig.app.json
┃ ┣ 📜tsconfig.json
┃ ┣ 📜tsconfig.node.json
┃ ┗ 📜vite.config.ts
┣ 📂tests
┃ ┣ 🔧.gitignore
┃ ┗ 🔧requirements.txt
┣ 📑Battle-cursor.drawio
┗ 📑README.md
```

## Стек технологий

| Часть | Технологии |
| :--- | :--- |
| Backend | Django, DRF, JWT, Channels, Redis, Celery, Flower |
| Frontend | React, TypeScript, Redux Toolkit, React Router, Axios, React Hook Form, Zod, Vite |
| БД | SQLite → PostgreSQL |
| WebSocket | Django Channels + Redis |
| CORS | django-cors-headers |
| Hosting | ??? |

#### Префиксы

| Префикс | Когда использовать |
| :--- | :--- |
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `refactor:` | Рефакторинг (процесс изменения внутренней структуры) без изменения поведения |
| `wip:` | Незавершённая работа (как срочный коммит) |
| `docs:` | Изменения только в документации |
| `style:` | Форматирование, пробелы — без изменения логики |
| `test:` | Добавление или исправление тестов |
| `perf:` | Улучшение производительности |
| `chore:` | Зависимости, конфиги, инструменты |
| `build:` | Сборочная система, скрипты |
| `revert:` | Откат предыдущего коммита |

## Запуск проекта

**Backend**
```bash
cd backend
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Redis**
```bash
redis-server
```

**Celery**
```bash
celery -A config worker --loglevel=info --pool=solo
```

```bash
celery -A config flower
```

> Для мониторинга, открыть в браузере: http://localhost:5555

**Tests**
```bash
cd "название приложения"
pytest tests.py -s
```

> Запуск происходит в отдельных терминалах

## Переменные окружения

### Создание файла .env

В проекте мы пользуемся дебагером и некоторыми личными данными, которые не должны быть в репозитории

Создайте файл с названием ".env" в директории "backend"

### Шаблон файла

Файл должен иметь базовый шаблон с переменным окружением

```
DEBUG=True
EMAIL_HOST_USER=ВАША_ПОЧТА
EMAIL_HOST_PASSWORD=ТОКЕН_ПОЧТЫ
DEFAULT_FROM_EMAIL=ВАША_ПОЧТА
```

> записать данные нужно без пробела после "="

```
git clone https://github.com/ZeBro-pentest/Battle-cursor.git
```

> Последнее обновление README 02.05.2026