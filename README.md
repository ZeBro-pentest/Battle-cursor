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
| Почта | Gmail SMTP (Mailtrap — только для локальных тестов) |
| Тесты | Playwright e2e + Allure (Newman для REST) |
| CORS | django-cors-headers |

---

## Структура проекта

```
📦 Battle-cursor
│
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
│
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
│
├── 📂 Diagrams/             # визуальная документация
│   ├── 📑 Diagrams.drawio
│   └── 📑 README.md
│
├── 📂 tests/
│   ├── 📂 backend
│   ├── 📂 frontend
│   │   ├── 🔧 .env.test
│   │   └── 📂 e2e/           # Playwright тесты (auth, shop, profile)
│   ├── 📂 postman/           # Postman коллекция
│   │   └── 📂 collections/  
│   ├── 📑 README.md
│   ├── 📜 package.json
│   ├── 🔧 .gitignore
│   └── 🔧 requirements.txt
│
├── 🔧 .gitignore
├── 📑 CLAUDE.md
└── 📑 README.md
```

---

## Быстрый старт (Docker)

### 1. Клонирование
```bash
git clone https://github.com/ZeBro-pentest/Battle-cursor.git
cd Battle-cursor
```

### 2. Настройка .env
Создай `backend/.env` на основе раздела "Переменные окружения" ниже.
Минимально необходимые:
- `SECRET_KEY`
- `GROQ_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (Gmail App Password)

### 3. Установка Docker

**Fedora/RHEL:**
```bash
sudo curl -o /etc/yum.repos.d/docker-ce.repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker $USER && newgrp docker
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
```

### 4. Сборка и запуск
```bash
make docker-build
make docker-up
```

Приложение доступно на http://localhost

### 5. Инициализация данных (первый запуск)
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py init_game_data
```

### 6. Доступ через ngrok (для внешнего доступа)
```bash
# Установка ngrok: https://ngrok.com/download
# Авторизация: ngrok config add-authtoken ВАШ_ТОКЕН
make ngrok
```

Скинь ngrok URL другу — он сможет зайти без дополнительных настроек.

### Остановка
```bash
make docker-down
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

## Локальный запуск (без Docker)

Все команды выполняются из директории `backend/`. Каждый сервис — в отдельном терминале.

```bash
make run          # запуск backend (Daphne)
make build        # сборка фронта + collectstatic
make migrate      # миграции
make celery       # Celery worker
make celery-beat  # Celery beat
make flower       # мониторинг задач (http://localhost:5555)
make ngrok        # ngrok туннель на порт 8000
make shell        # Django shell
make superuser    # создать суперпользователя
```

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

# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=ваш@gmail.com
EMAIL_HOST_PASSWORD=ваш-app-password
EMAIL_USE_TLS=True

# Groq (из console.groq.com)
GROQ_API_KEY=ваш-groq-api-key

# Frontend
FRONTEND_URL=http://localhost:5173 или ссылка на ngrok при build

# Gmail
DEFAULT_FROM_EMAIL=ваш-email@gmail.com
```

> Значения записываются без пробелов вокруг `=`

---

## Переменные окружения — Frontend

Создайте файл `.env` в директории `frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000/
```

Для работы через ngrok:

```env
VITE_API_URL=https://your-ngrok-url.ngrok-free.dev/
```

---

## Запуск тестов

**Playwright (e2e)**
```bash
cd tests/frontend
npx playwright install chromium
npx playwright test
```

**Allure отчёт**
```bash
npx allure serve ../allure-results
```

**Newman (REST автотесты)**
```bash
cd tests && npm run test:run
```

---

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

> Последнее обновление README: 26.06.2026
