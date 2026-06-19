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
| ИИ | Groq (грейдинг рисунков) |
| Почта | Gmail (Mailtrap для тестов) |
| CORS | django-cors-headers |

---

## Структура проекта

```
📦 Battle-cursor
├── 📂 backend
│   ├── ⚙️ config/
│   ├── 📂 assets/            # Cloudinary
│   │   └── 📂 images/
│   │       ├── 📂 canvas
│   │       ├── 📂 cursors
│   │       └── metadata.json # данные cursors/canvas
│   ├── 📂 templates/
│   │   └── 📂 emails/
│   │       ├── verification.html
│   │       └── welcome.html
│   ├── 📂 users/            # User, Cursor, Canvas, EmailVerification
│   ├── 📂 game/             # Game, Round, Score
│   ├── 📂 market/           # Inventory, Purchase
│   ├── 📂 ai/               # грейдинг через Groq (Celery задачи)
│   ├── 📂 servers/          # WebSocket consumers (Django Channels)
│   ├── 🔧 .env
│   ├── 🔧 .gitignore
│   ├── 🔧 requirements.txt
│   └── 📜 manage.py
├── 📂 frontend
│   ├── 📂 public/
│   │   └── 📂 images/
│   │       ├── 📂 canvas
│   │       └── 📂 cursors
│   ├── 📂 src/
│   │   ├── 📂 assets/
│   │   ├── 📂 components/
│   │   ├── 📂 hooks/
│   │   ├── 📂 pages/
│   │   ├── 📂 services/     # axios, api
│   │   ├── 📂 store/        # Redux Toolkit
│   │   └── 📂 types/
│   ├── 📜 package.json
│   └── 📜 vite.config.ts
├── 📂 Diagrams/
│   ├── 📑 Diagrams.drawio
│   └── 📑 README.md
├── 📂 tests/
│   ├── 📂 backend
│   ├── 📂 frontend
│   ├── 📂 postman/           # Postman коллекция
│   ├── 📑 README.md
│   ├── 📜 package.json
│   ├── 🔧 .gitignore
│   └── 🔧 requirements.txt
└── 📑 README.md
```

---

## Git префиксы

| Префикс | Когда использовать |
| :--- | :--- |
| `feat:` | Новая функциональность |
| `fix:` | Исправление бага |
| `refactor:` | Рефакторинг без изменения поведения |
| `wip:` | Незавершённая работа |
| `docs:` | Изменения только в документации |
| `style:` | Форматирование, пробелы — без изменения логики |
| `test:` | Добавление или исправление тестов |
| `perf:` | Улучшение производительности |
| `chore:` | Зависимости, конфиги, инструменты |
| `build:` | Сборочная система, скрипты |
| `revert:` | Откат предыдущего коммита |

---

## Запуск проекта

**Backend**
```bash
cd backend
make run
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

# Groq (из console.groq.com)
GROQ_API_KEY=ваш-groq-api-key

# Frontend
FRONTEND_URL=http://localhost:5173

# Gmail
DEFAULT_FROM_EMAIL=ваш-email@gmail.com
```

> Значения записываются без пробелов вокруг `=`

## Клонирование

```bash
git clone https://github.com/ZeBro-pentest/Battle-cursor.git
```

> Запуск команды `python backend/manage.py init_game_data` инициализирует данные для игры

```bash
python backend/manage.py init_game_data
```

### Роли в связке

## Obsidian

Хранилище, выступающее в роли вашей внешней памяти или «второго мозга». В нем хранятся проектные доки, API-спецификации, задачи и логи.

## Claude Code

Автономный ИИ-агент, который пишет код, читает файлы и выполняет задачи, опираясь на ваш контекст.

## Graphify

Граф знаний проекта. Он анализирует всё ваше хранилище и код, а затем создает легкие карты связей. Claude обращается к Graphify вместо того, чтобы сканировать тысячи строк кода вслепую.

> Последнее обновление README: 19.06.2026
