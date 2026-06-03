# Battle-cursor

Онлайн веб-игра где игроки рисуют по заданию ИИ, мешают друг другу дебаффами и соревнуются за лучший результат.

Цель — нарисовать случайный предмет лучше остальных. В конце каждого раунда ИИ оценивает рисунки, победитель получает монеты.

> Игра только для десктопов, мобильный формат не поддерживается.

---

## Механика

- До 8 игроков рисуют одновременно на своих холстах
- Все видят курсоры и холсты друг друга (без рисунка)
- За монеты можно применять дебаффы — мешать соперникам
- Курсор содержит набор дебаффов, холст — защиту от них
- Курсоры и холсты покупаются в магазине
- Количество раундов = количество игроков
- В конце всех раундов объявляется победитель

---

## Стек технологий

| Часть | Технологии |
| :--- | :--- |
| Backend | Django, DRF, SimpleJWT, Channels, Daphne |
| Очереди | Celery, Celery Beat, Flower |
| Кэш / Брокер | Redis |
| Frontend | React 19, TypeScript, Redux Toolkit, React Router v7, Axios, React Hook Form, Zod, Vite |
| БД | SQLite |
| WebSocket | Django Channels + Redis, нативный WebSocket (фронт) |
| Хранилище | Cloudinary (курсоры, холсты) |
| ИИ | Gemini 2.5 Flash (грейдинг рисунков) |
| Почта | Mailtrap (верификация, приветствие) |
| CORS | django-cors-headers |

---

## Структура проекта

```
📦 Battle-cursor
├── 📂 backend
│   ├── ⚙️ config/           # настройки Django
│   ├── 📂 templates/
│   │   └── 📂 emails/       # шаблоны писем
│   │       ├── verification.html
│   │       └── welcome.html
│   ├── 📂 users/            # User, Cursor, Canvas, EmailVerification
│   ├── 📂 game/             # Game, Round, Score
│   ├── 📂 market/           # Inventory, Purchase
│   ├── 📂 ai/               # грейдинг через Gemini (Celery задачи)
│   ├── 📂 servers/          # WebSocket consumers (Django Channels)
│   ├── 🔧 .env
│   ├── 🔧 .gitignore
│   ├── 🔧 requirements.txt
│   └── 📜 manage.py
├── 📂 frontend
│   ├── 📂 public/
│   ├── 📂 src/
│   │   ├── 📂 assets/
│   │   ├── 📂 components/   # Header, Footer, Loader, modals
│   │   ├── 📂 hooks/
│   │   ├── 📂 pages/        # Home, NotFound и др.
│   │   ├── 📂 services/     # axios, api
│   │   ├── 📂 store/        # Redux Toolkit
│   │   └── 📂 types/
│   ├── 📜 package.json
│   └── 📜 vite.config.ts
├── 📂 Diagrams/             # визуальная документация
│   ├── 📑 Diagrams.drawio
│   └── 📑 README.md
├── 📂 tests/
└── 📑 README.md
```

---

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

**Celery worker**
```bash
celery -A config worker --loglevel=info --pool=solo
```

**Celery beat**
```bash
celery -A config beat --loglevel=info
```

**Flower** (мониторинг задач)
```bash
celery -A config flower
```

> Flower доступен по адресу: http://localhost:5555

> Все сервисы запускаются в отдельных терминалах

---

## Переменные окружения

Создайте файл `.env` в директории `backend/`:

```env
# Django
SECRET_KEY=ваш-секретный-ключ
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Cloudinary
CLOUDINARY_CLOUD_NAME=ваш-cloud-name
CLOUDINARY_API_KEY=ваш-api-key
CLOUDINARY_API_SECRET=ваш-api-secret

# Mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_HOST_USER=ваш-mailtrap-user
EMAIL_HOST_PASSWORD=ваш-mailtrap-password

# Gemini
GEMINI_API_KEY=ваш-gemini-api-key
```

> Значения записываются без пробелов вокруг `=`

---

## Git префиксы

| Префикс | Когда использовать |
| :--- | :--- |
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `refactor:` | Рефакторинг без изменения поведения |
| `wip:` | Незавершённая работа (срочный коммит) |
| `docs:` | Изменения только в документации |
| `style:` | Форматирование, пробелы — без изменения логики |
| `test:` | Добавление или исправление тестов |
| `perf:` | Улучшение производительности |
| `chore:` | Зависимости, конфиги, инструменты |
| `build:` | Сборочная система, скрипты |
| `revert:` | Откат предыдущего коммита |

---

## Клонирование

```bash
git clone https://github.com/ZeBro-pentest/Battle-cursor.git
```

> Последнее обновление README: 03.06.2026
