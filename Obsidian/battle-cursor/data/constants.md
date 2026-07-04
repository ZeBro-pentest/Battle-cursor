# Константы и конфигурация

## AI (backend/ai/config.py)

| Константа | Значение |
|-----------|---------|
| `GROQ_MODEL` | `meta-llama/llama-4-maverick-17b-128e-instruct-fp8` |
| `GROQ_API_URL` | `https://api.groq.com/openai/v1/chat/completions` |
| `GRADING_PROMPT` | Системный промпт для оценки рисунков (0.1–5.0) |
| `PROMPT_GENERATION_PROMPT` | Системный промпт для генерации промптов на русском |

## WebSocket (consumers.py)

| Константа | Значение |
|-----------|---------|
| `ONLINE_TTL` | 20 сек |
| `DRAWING_TTL` | 300 сек (5 мин) |

## Celery таймауты

| Событие | Задержка |
|---------|---------|
| force_grade_round | 65s после start_round |
| start_round следующий | 10s после grade_round (on_commit) |
| game_over | 10s после grade_round последнего раунда (on_commit) |
| kick_offline_player | 30s после disconnect() |
| delete_game | 60s после game_over (on_commit) |
| cleanup_drawings | 60s после game_over |
| delete_server_if_host_absent | 10s после disconnect() хоста |

## Redis TTL

| Ключ | TTL |
|------|-----|
| `user:{id}:online` | 20s |
| `game:{id}:players_count` | 3600s |
| `game:{id}:coins:{user_id}` | 3600s |
| `game:{id}:offline:{user_id}` | 35s |
| `game:{id}:debuff_active:{user_id}` | duration / 5s (LEGENDARY) |
| `game:{id}:used_debuff:{user_id}:{debuff_id}` | 70s |
| `game:{id}:protection_used:{target_id}:{debuff_id}` | 70s |
| `round:{id}:drawing:{user_id}` | 300s |
| `round:{id}:submitted` | 300s |
| `round:{id}:task_id` | 120s |
| `round:{id}:grading_lock` | 120s |
| `server:{room_code}:host_disconnected` | 30s |

## Дебаффы — LEGENDARY_DEBUFFS set

Определён в `consumers.py handle_debuff_apply`:
```python
LEGENDARY_DEBUFFS = {
    "questions", "exam", "weighting", "weapons", "rickroll",
    "disco", "transparency", "brightness", "roulette", "dvd",
}
```

## Frontend — цвета редкости

```ts
DEBUFF_RARITY_COLOR = {
  COMMON:    "#888",
  RARE:      "#4488ff",
  EPIC:      "#aa44ee",
  MYTHIC:    "#FF0606",
  LEGENDARY: "#ffcc00",
}
```

## Игровые параметры

| Параметр | Значение |
|----------|---------|
| Макс. игроков | 8 |
| Кол-во раундов | = кол-во игроков |
| Длительность раунда | 60 сек |
| Страховочный таймер | 65 сек |
| Оценка Groq | 0.1 — 5.0 |
| Монеты за раунд | score × 10 |
| Рейтинг за победу | +1 |

## Server status choices

```python
WAITING = "waiting"
IN_PROGRESS = "in_progress"
FINISHED = "finished"
```

## RarityChoices (Cursor / Canvas)

```python
NULL = "NULL"
COMMON = "COMMON"
RARE = "RARE"
EPIC = "EPIC"
MYTHIC = "MYTHIC"
LEGENDARY = "LEGENDARY"
```
