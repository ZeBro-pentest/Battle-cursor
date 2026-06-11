DEBUFFS = [
    {
        "id": "chill",
        "name": "Chill",
        "description": "Замедляет скорость движения курсора на 20%",
        "duration": 5,
        "rarity": "COMMON",
    },
    {
        "id": "blur",
        "name": "Blur",
        "description": "Слегка размывает интерфейс холста",
        "duration": 5,
        "rarity": "COMMON",
    },
    {
        "id": "fog",
        "name": "Fog",
        "description": "Во весь экран появляется туман",
        "duration": 5,
        "rarity": "COMMON",
    },
]

# Только id дебаффов доступных для защиты холста
PROTECTABLE_DEBUFF_IDS = {d["id"] for d in DEBUFFS}
