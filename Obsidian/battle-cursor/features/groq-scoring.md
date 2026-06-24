---
tags: [feature]
---

# Groq AI — Оценка и генерация промптов

## Модель
`meta-llama/llama-4-maverick-17b-128e-instruct-fp8`

Настройки в `ai/config.py`: `GROQ_MODEL`, `GROQ_API_URL`, `GRADING_PROMPT`, `PROMPT_GENERATION_PROMPT`.

---

## grade_drawing — оценка рисунка

```python
grade_drawing(image_base64: str, prompt: str) → {"score": float, "comment": str}
```

- Принимает рисунок в base64 + текст промпта
- Groq оценивает насколько рисунок соответствует промпту
- Возвращает `score` (0.1–5.0) и текстовый `comment`
- Вызывается в `grade_round` Celery задаче для каждого игрока

---

## generate_prompts — генерация заданий

```python
generate_prompts(count: int) → list[str]
```

- Генерирует `count` уникальных промптов для раундов
- Промпты **на русском языке**
- При ошибке возвращает дефолтные промпты (fallback)
- Вызывается в `ServerService.start_game()` перед созданием раундов

---

## _groq_text_request — базовый запрос

Внутренний метод `ai/services.py`. Базовый текстовый запрос к Groq без изображения. Используется `generate_prompts`.

---

## Интеграция с игровым циклом

```
start_game → generate_prompts(n_players) → Round.prompt × n
grade_round → grade_drawing(drawing, round.prompt) × n_players → Score × n_players
```

---

## Связанные заметки
- [[features/game-cycle]] — когда вызываются Groq сервисы
- [[data/models-game]] — Score хранит value + comment + image_url
