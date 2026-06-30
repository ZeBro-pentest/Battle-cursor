import json
import logging
import random
import time

import requests
from django.conf import settings

from .config import (
    GRADING_PROMPTS,
    GROQ_API_URL,
    GROQ_MAX_TOKENS,
    GROQ_MODEL,
    GROQ_TEMPERATURE,
    PROMPT_GENERATION_PROMPT,
)

logger = logging.getLogger(__name__)

_FALLBACK_PROMPTS = [
    # Животные
    "Нарисуй кота",
    "Нарисуй собаку",
    "Нарисуй лису",
    "Нарисуй медведя",
    "Нарисуй дракона",
    "Нарисуй рыбу",
    "Нарисуй птицу",
    "Нарисуй лошадь",
    "Нарисуй кролика",
    "Нарисуй осьминога",
    # Предметы
    "Нарисуй машину",
    "Нарисуй замок",
    "Нарисуй корабль",
    "Нарисуй самолёт",
    "Нарисуй велосипед",
    "Нарисуй гитару",
    "Нарисуй часы",
    "Нарисуй ракету",
    # Еда
    "Нарисуй торт",
    "Нарисуй пиццу",
    "Нарисуй арбуз",
    "Нарисуй мороженое",
    "Нарисуй суши",
    "Нарисуй бургер",
    # Природа
    "Нарисуй дерево",
    "Нарисуй гору",
    "Нарисуй вулкан",
    "Нарисуй радугу",
    "Нарисуй закат над морем",
    # Сцены
    "Нарисуй дом в лесу",
    "Нарисуй космический корабль в открытом космосе",
    "Нарисуй подводный город",
    "Нарисуй рыцаря на коне",
]


def _groq_text_request(
    prompt_text: str, max_tokens: int = GROQ_MAX_TOKENS, temperature: float = GROQ_TEMPERATURE
) -> str | None:
    """Базовый текстовый запрос к Groq без изображения."""
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "max_completion_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt_text}],
    }
    try:
        response = requests.post(
            GROQ_API_URL, json=payload, headers=headers, timeout=15
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except requests.RequestException as e:
        logger.error("Groq text request failed: %s", e)
        return None
    except (KeyError, ValueError) as e:
        logger.error("Groq text response parse error: %s", e)
        return None


def grade_drawing(image_base64: str, prompt: str) -> dict:
    """
    Отправляет рисунок в Groq и возвращает оценку и комментарий.

    Returns:
        {"score": float, "comment": str}
    """
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "max_completion_tokens": GROQ_MAX_TOKENS,
        "temperature": GROQ_TEMPERATURE,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}",
                        },
                    },
                    {
                        "type": "text",
                        "text": random.choices(GRADING_PROMPTS, weights=[50, 10, 20, 10, 10], k=1)[0].format(prompt=prompt),
                    },
                ],
            }
        ],
    }
    for attempt in range(3):
        try:
            response = requests.post(
                GROQ_API_URL, json=payload, headers=headers, timeout=30
            )
            if response.status_code == 429:
                wait = 2 ** attempt
                logger.warning("Groq 429, retry %d after %ds", attempt + 1, wait)
                time.sleep(wait)
                continue
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"].strip()
            result = json.loads(content)
            score = float(result["score"])
            score = max(0.1, min(5.0, score))
            return {"score": score, "comment": result["comment"]}
        except requests.RequestException as e:
            if attempt == 2:
                logger.error("Groq request failed after 3 attempts: %s", e)
                return {"score": 0.1, "comment": "Ошибка оценки."}
            time.sleep(2 ** attempt)
        except (KeyError, json.JSONDecodeError, ValueError) as e:
            logger.error("Groq response parse error: %s", e)
            return {"score": 0.1, "comment": "Ошибка оценки."}

    return {"score": 0.1, "comment": "Ошибка оценки."}


def generate_prompts(count: int) -> list[str]:
    """
    Генерирует уникальные промпты для раундов через Groq.
    При ошибке возвращает дефолтные промпты.

    Returns:
        list[str] длиной count
    """
    text = _groq_text_request(
        PROMPT_GENERATION_PROMPT.format(count=count),
        max_tokens=500,
        temperature=1.0,
    )
    logger.info("Groq prompts response: %s", text)
    if text:
        try:
            prompts = json.loads(text)
            if isinstance(prompts, list) and len(prompts) >= count:
                return [str(p) for p in prompts[:count]]
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("Groq prompts parse error: %s", e)

    logger.warning("Falling back to default prompts")
    import random
    return random.sample(_FALLBACK_PROMPTS, min(count, len(_FALLBACK_PROMPTS)))
