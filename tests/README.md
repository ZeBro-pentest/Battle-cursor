# Tests

Тестирование проекта Battle-cursor.

---

## Структура

```
tests/
├── backend/
│   ├── unit/              # юнит-тесты: сервисы, валидаторы, сериализаторы
│   ├── integration/       # интеграционные тесты: БД, Redis
│   └── api/               # api-тесты: эндпоинты через pytest-django
├── postman/
│   ├── collections/       # коллекции запросов
│   ├── data/              # данные для запросов
│   └── environments/      # окружения (dev, prod)
├── frontend/
│   └── e2e/               # end-to-end тесты через Playwright
├── allure-results/        # результаты для Allure отчётов (создаеться автоматически)
├── allure-report/         # отчёт Allure (создаеться автоматически)
├── .gitignore             # игнорирование результатов Allure и кеша
├── requirements.txt
└── README.md
```

---

## Стек

| Часть | Инструмент |
| :--- | :--- |
| Backend | pytest, pytest-django |
| Отчёты | Allure |
| Postman | Postman, newman (CLI) |
| Frontend | Playwright |

---

## Пирамида тестирования

```
        e2e ~ 5%          →  Playwright
       api ~ 15%          →  pytest-django
    integration ~ 20%     →  pytest-django + БД
       unit ~ 60%         →  сервисы, валидаторы, сериализаторы
```

---

## Запуск

**Backend — все тесты**
```bash
cd tests
pytest backend/ -v
```

**Backend — с Allure отчётом**
```bash
pytest backend/ -v --alluredir=allure-results
allure serve allure-results
```

**Backend — только юнит**
```bash
pytest backend/unit/ -v
```

**Backend — только api**
```bash
pytest backend/api/ -v
```

**Frontend — e2e**
```bash
cd tests/frontend
playwright test
```

---

## Postman & Newman

### Структура
- `collections/`: JSON файлы коллекций Postman.
- `environments/`: Настройки окружения (BASE_URL и т.д.).
- `data/`: Данные для автоматизированных тестов (не коммитятся в Git).

### Подготовка данных
Для запуска тестов с собственными данными, создайте файл `tests/postman/data/test_user.json` по следующему шаблону:
```json
[
  {
    "username": "your_test_user",
    "email": "your_email@example.com",
    "password": "YourStrongPassword123!",
    "password_confirm": "YourStrongPassword123!",
    "coins": 100
  }
]
```

### Окружение
Перед запуском убедитесь что файл окружения `tests/postman/environments/dev.json` существует. Шаблон:
```json
{
  "name": "Battle-cursor Dev",
  "values": [
    { "key": "BASE_URL", "value": "http://127.0.0.1/api", "enabled": true },
    { "key": "username", "value": "your_test_user", "enabled": true },
    { "key": "email", "value": "your_email@example.com", "enabled": true },
    { "key": "password", "value": "YourStrongPassword123!", "enabled": true },
    { "key": "password_confirm", "value": "YourStrongPassword123!", "enabled": true },
    { "key": "coins", "value": "100", "enabled": true }
  ]
}

### Запуск тестов

**Запуск тестов с авто-созданием отчета:**

```bash
npm run test -s
```

> авто-тесты сразу чистят старые отчеты `results/`, затем проверка API, после newman и сразу allure, отчет генерируется автоматически (полдробнее в package.json)

**Запуск тестов с созданием отчета:**

```bash
npm test -s
```

**Генерация отчета:**

```bash
npm run report:generate
```

**Открытие отчета:**

```bash
npm run report:open
```

---
*Примечание: Перед запуском убедитесь, что сервер Django запущен и в настройках установлен `DEBUG=True` (для получения токенов верификации).*

---

## Установка зависимостей

> Создаем виртуальное окружение и устанавливаем зависимости:

```bash
python -m venv .venv
source .venv/bin/activate  # для Windows: .venv\Scripts\activate
```

```bash
pip install -r tests/requirements.txt
```

```bash
npm install
```

> Последнее обновление: 15.06.2026
