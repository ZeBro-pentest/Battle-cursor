# Дебаффы тестовые!!!!
DEBUFFS = [
    # Дефолтные — иммунитет холста не действует
    {
        "id": "another_world",
        "name": "Иной мир",
        "description": "Переворачивает игру противнику",
        "price": 3,
        "duration": 5,
        "default_duration": 2,
        "is_default": True,
    },
    {
        "id": "buy_elephant",
        "name": "Купи слона",
        "description": "Цены дебаффов у противника x2 на время действия",
        "price": 5,
        "duration": 15,
        "default_duration": 3,
        "is_default": True,
    },
    {
        "id": "captcha",
        "name": "Капча",
        "description": "Игрок должен решить капчу чтобы продолжить рисовать",
        "price": 4,
        "duration": None,
        "default_duration": 3,
        "is_default": True,
    },
    {
        "id": "spin",
        "name": "Крутите барабан!",
        "description": "Вся игра у противника начинает вращаться",
        "price": 3,
        "duration": 5,
        "default_duration": 2,
        "is_default": True,
    },
    {
        "id": "ads",
        "name": "Реклама",
        "description": "Рандомные модальные окна которые нужно закрыть чтобы рисовать",
        "price": 4,
        "duration": None,
        "default_duration": 2,
        "is_default": True,
    },
    # Обычные — иммунитет холста действует
    # добавлю чуть позже
]

# Только id дебаффов доступных для защиты холста
PROTECTABLE_DEBUFF_IDS = {d["id"] for d in DEBUFFS if not d["is_default"]}
