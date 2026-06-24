---
tags: [model]
---

# Модели: Game

## Game
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| server | OneToOne → Server | привязка к комнате |
| status | choices | PENDING / IN_PROGRESS / FINISHED |
| created_at | datetime | |
| finished_at | datetime | null until game_over |

Игра создаётся через WebSocket событие `game_start` → `ServerService.start_game()`.

---

## Round
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| game | FK → Game | |
| round_number | int | порядковый номер (1-based) |
| prompt | str | задание от Groq (на русском) |
| status | choices | PENDING / IN_PROGRESS / FINISHED |
| started_at | datetime | |
| finished_at | datetime | |

Количество раундов = количество игроков (макс 8).
Длительность раунда: 60 сек.

---

## Score
| Поле | Тип | Описание |
|---|---|---|
| id | UUID | PK |
| round | FK → Round | |
| user | FK → User | |
| value | FloatField | оценка от Groq: 0.1–5.0 |
| comment | TextField | комментарий Groq |
| image_url | URLField | Cloudinary URL рисунка |

Монеты начисляются только по итогам **всех** раундов: `score × 10`.
Синхронизация в БД только в `game_over`.

---

## Redis (игровое состояние)
| Ключ | Значение | TTL |
|---|---|---|
| `game:{id}:players_count` | int | 3600 сек |
| `round:{id}:drawing:{user_id}` | `{image_base64, image_url}` | 300 сек |
| `round:{id}:task_id` | Celery task ID | 120 сек |
| `game:{id}:debuff_active:{user_id}` | debuff_id | duration сек |

---

## Связанные заметки
- [[data/models-server]] — Server → Game (OneToOne)
- [[features/game-cycle]] — полный игровой цикл
- [[features/groq-scoring]] — как Groq оценивает рисунки
- [[features/debuffs]] — дебаффы во время раунда
