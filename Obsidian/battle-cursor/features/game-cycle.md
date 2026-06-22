---
tags: [feature]
---

# Игровой цикл

## Схема

```
game_start (WS от host)
  → ServerService.start_game()
      → создаёт Game
      → создаёт Rounds (кол-во = кол-ву игроков, макс 8)
      → генерирует промпты через Groq (на русском)
      → cache.set(game:{id}:players_count)
      → start_round.delay(first_round_id, game_id, room_group)

start_round (Celery)
  → пушит round_started {round_id, round_number, prompt, duration: 60}
  → ставит force_grade_round.apply_async(countdown=65)
  → сохраняет task_id в Redis: round:{id}:task_id TTL=120

─── Игроки рисуют 60 сек, применяют дебаффы ───

round_end (WS от каждого игрока)
  → сохраняет рисунок в Redis: round:{id}:drawing:{user_id} TTL=300
  → если все игроки сдали:
      → revoke(force_grade_round task_id)
      → grade_round.delay()

force_grade_round (Celery, страховка 65 сек)
  → пропускает если раунд уже завершён
  → иначе вызывает grade_round

grade_round (Celery)
  → забирает рисунки из Redis
  → grade_drawing() для каждого игрока через Groq
  → сохраняет Score в БД (value: 0.1–5.0, image_url, comment)
  → удаляет ключи рисунков из Redis
  → пушит round_results {scores: [...]}
  → если есть следующий раунд → start_round.apply_async(countdown=5)
  → если последний раунд → game_over.apply_async(countdown=5)

game_over (Celery)
  → считает итоги по всем Score раундов
  → GameService.finish()
      → sync_coins_to_db() — coins += score × 10 для каждого
      → rating += 1 победителю (1 место)
  → пушит game_over {final_scores: [...]}
```

---

## Celery задачи (`ai/tasks.py`)

| Задача | Триггер | Действие |
|---|---|---|
| `start_round` | `game_start` WS или предыдущий `grade_round` | стартует раунд |
| `grade_round` | все сдали `round_end` или `force_grade_round` | оценивает рисунки |
| `force_grade_round` | countdown=65 от `start_round` | страховка |
| `game_over` | последний раунд оценён | финал |

---

## Очки и монеты
- Groq оценивает 0.1–5.0
- Монеты: `score × 10`, начисляются **только в game_over**
- В ходе игры монеты не тратятся и не начисляются
- Рейтинг: +1 только победителю

---

## Связанные заметки
- [[features/groq-scoring]] — как работает оценка
- [[features/debuffs]] — дебаффы во время раунда
- [[data/models-game]] — Game, Round, Score
- [[data/models-server]] — Server, GameConsumer
