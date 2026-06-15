# Лимиты
MAX_PLAYERS = 8
MIN_PLAYERS = 2

# Таймауты
DISCONNECT_TIMEOUT = 30  # секунд до кика при дисконнекте
PING_INTERVAL = 5  # как часто клиент пингует (секунды)

# Redis ключи
ROOM_PLAYERS_KEY = "room:{room_code}:players"
ROOM_STATE_KEY = "room:{room_code}:state"
