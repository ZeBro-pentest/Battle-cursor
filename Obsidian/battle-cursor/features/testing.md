---
tags: [feature]
---

# Тестирование

## Пирамида

```
        e2e ~ 5%          →  Playwright
       api ~ 15%          →  pytest-django
    integration ~ 20%     →  pytest-django + БД
       unit ~ 60%         →  сервисы, валидаторы, сериализаторы
```

---

## Структура

```
tests/
├── backend/
│   ├── unit/              # сервисы, валидаторы, сериализаторы
│   ├── integration/       # БД, Redis
│   └── api/               # эндпоинты через pytest-django
├── postman/
│   ├── collections/       # JSON коллекции
│   ├── data/              # test_user.json (не в git)
│   └── environments/      # dev.json (BASE_URL, credentials)
└── frontend/
    └── e2e/               # Playwright e2e тесты
```

---

## Запуск

### Backend (pytest)
```bash
cd tests
pytest backend/ -v                              # все тесты
pytest backend/unit/ -v                         # только юнит
pytest backend/api/ -v                          # только api
pytest backend/ -v --alluredir=allure-results   # с Allure
allure serve allure-results
```

### Frontend (Playwright)
```bash
cd tests/frontend
playwright test
```

### Postman + Newman + Allure
```bash
cd tests
npm run test -s    # тесты + авто-отчёт (чистит results/, запускает newman, генерит allure)
npm test -s        # тесты с отчётом
npm run report:generate
npm run report:open
```

> Перед запуском: Django сервер должен быть запущен, `DEBUG=True`

---

## Postman — подготовка данных

Создать `tests/postman/data/test_user.json`:
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

Создать `tests/postman/environments/dev.json`:
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
```

---

## Установка

```bash
cd tests
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
npm install
```

---

## Связанные заметки
- [[architecture/decisions]] — стек тестирования в таблице
- [[data/models-users]] — что тестируется в users
- [[features/game-cycle]] — WS и игровой цикл тестируются вручную через Postman GUI
