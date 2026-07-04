<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=1a0000,0b0b0b&height=250&section=header&text=Battle-cursor&fontSize=60&fontColor=ff0606&animation=fadeIn&fontAlignY=38&desc=Браузерная%20PvP%20игра%20●%20Рисуй%20●%20Дебаффай%20●%20Побеждай&descAlignY=54&descAlign=50&descSize=16&descColor=ffffff" alt="Header" />
</p>

Онлайн веб-игра где игроки рисуют по заданию ИИ, мешают друг другу дебаффами и соревнуются за лучший результат.

Цель — нарисовать случайный предмет лучше остальных. В конце всех раундов ИИ оценивает рисунки, все игроки получают монеты (оценка × 10), победитель дополнительно получает +1 к рейтингу.

> Игра только для десктопов, мобильный формат не поддерживается.

---

## Механика

- До 8 игроков рисуют одновременно на своих холстах
- Все видят курсоры и канвасы друг друга
- Можно применять дебаффы — мешать соперникам
- Курсор содержит набор дебаффов, канвас — защиту от них
- Курсоры и канвасы покупаются в магазине
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
| ИИ | Groq (грейдинг рисунков + генерация промптов) |
| Почта | Gmail SMTP |
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
│   │       └── 📜 metadata.json # данные cursors/canvas
│   ├── 📂 templates/
│   │   └── 📂 emails/
│   │       ├── verification.html
│   │       └── welcome.html
│   ├── 📂 users/            # User, Cursor, Canvas, EmailVerification
│   ├── 📂 game/             # Game, Round, Score
│   ├── 📂 market/           # Inventory, Purchase
│   ├── 📂 ai/               # грейдинг через Groq (Celery задачи)
│   ├── 📂 servers/          # WebSocket consumers (Django Channels)
│   ├── 🐳 Dockerfile
│   ├── 🔧 Makefile
│   ├── 🔧 .env
│   ├── 🔧 .gitignore
│   ├── 🔧 requirements.txt
│   └── 📜 manage.py
│
├── 📂 frontend
│   ├── 📂 public/
│   │   ├── 📂 images/
│   │   │   ├── 📂 canvas
│   │   │   └── 📂 cursors
│   │   └── 📂 sounds/
│   ├── 📂 src/
│   │   ├── 📂 assets/
│   │   ├── 📂 components/
│   │   ├── 📂 constants/
│   │   ├── 📂 hooks/
│   │   ├── 📂 pages/
│   │   ├── 📂 services/     # axios, api
│   │   ├── 📂 store/        # Redux Toolkit
│   │   ├── 📂 types/
│   │   └── 📂 utils/
│   ├── 🐳 Dockerfile
│   ├── 🔧 nginx.conf
│   ├── 🔧 .env
│   ├── 🔧 .env.production
│   ├── 📜 package.json
│   └── 📜 vite.config.ts
│
├── 📂 Diagrams/             # визуальная документация
│   ├── 📑 Battle-cursor.pdf # презентация
│   └── 📑 Diagrams.drawio
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
├── 🐳 docker-compose.yml
├── 🔧 Makefile
├── 🔧 .gitignore
├── 📑 CLAUDE.md
└── 📑 README.md
```

---

## Дальнейшие планы

### 1. Доделать дебафы (и автотесты с Playwright)

### 2. Изменить шрифты (и дизайн в целом)

### 3. Разновидность игр

### 4. Безопасность

### 5. Рейтинг изменить

### 6. Добавить авторизации с аккаунтов

### 7. Голосовой чат в игре

### 8. Кнопку "done" под рисунком, чтобы холст больше нельзя было нечаянно изменить

### 9. Дописать тесты

### > Вы можете помочь мне реализовать новые фичи, написав код или предложив идеи, жду ваших пулл-реквестов :)

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

# Redis (БД 0 — channel layer + Celery broker, БД 1 — cache)
REDIS_HOST=127.0.0.1
CACHE_URL=redis://127.0.0.1:6379/1

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
DEFAULT_FROM_EMAIL=ваш-email@gmail.com

# Groq (из console.groq.com)
GROQ_API_KEY=ваш-groq-api-key
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

---

## Роли в связке

## Obsidian

Хранилище, выступающее в роли вашей внешней памяти или «второго мозга». В нем хранятся проектные доки, API-спецификации, задачи и логи.

## Claude Code

Автономный ИИ-агент, который пишет код, читает файлы и выполняет задачи, опираясь на ваш контекст.

## Graphify

Граф знаний проекта. Он анализирует всё ваше хранилище и код, а затем создает легкие карты связей. Claude обращается к Graphify вместо того, чтобы сканировать тысячи строк кода вслепую.

---

## Разработка с Claude Code

Проект создан с помощью Claude Code. Использованные скиллы:

- **graphify** — граф знаний кодовой базы (`graphify-out/`): автоматическая пересборка после коммитов через git hook, инкрементальные обновления, навигация по коду командами `query` / `path` / `explain` вместо слепого сканирования исходников
- **code-review** — ревью кода: найдено и исправлено 10 критических багов (race condition в Celery-задачах `delete_game` vs `cleanup_drawings`, TOCTOU с двойным `grade_round`, запись монет вне транзакции, утечка TTL дебаффов между раундами и др.)
- **/save и /resume** (кастомные команды из CLAUDE.md) — журналирование сессий в Obsidian-хранилище (`Obsidian/battle-cursor/logs/`) и восстановление контекста между сессиями

> Последнее обновление README: 04.07.2026
