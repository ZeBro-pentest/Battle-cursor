import json
import logging

import requests
from django.conf import settings

from .config import (
    GRADING_PROMPT,
    GROQ_API_URL,
    GROQ_MAX_TOKENS,
    GROQ_MODEL,
    GROQ_TEMPERATURE,
    PROMPT_GENERATION_PROMPT,
)

logger = logging.getLogger(__name__)

DEFAULT_PROMPTS = [
    "Нарисуй кота",
    "Нарисуй дом",
    "Нарисуй машину",
    "Нарисуй дерево",
    "Нарисуй солнце",
    "Нарисуй рыбу",
    "Нарисуй цветок",
    "Нарисуй гору",
]


def _groq_text_request(
    prompt_text: str, max_tokens: int = GROQ_MAX_TOKENS
) -> str | None:
    """Базовый текстовый запрос к Groq без изображения."""
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "max_completion_tokens": GROQ_MAX_TOKENS,
        "temperature": GROQ_TEMPERATURE,
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
        "max_tokens": GROQ_MAX_TOKENS,
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
                        "text": GRADING_PROMPT.format(prompt=prompt),
                    },
                ],
            }
        ],
    }
    try:
        response = requests.post(
            GROQ_API_URL, json=payload, headers=headers, timeout=30
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        result = json.loads(content)
        score = float(result["score"])
        score = max(0.1, min(5.0, score))
        return {"score": score, "comment": result["comment"]}
    except requests.RequestException as e:
        logger.error("Groq request failed: %s", e)
        return {"score": 0.1, "comment": "Evaluation failed."}
    except (KeyError, json.JSONDecodeError, ValueError) as e:
        logger.error("Groq response parse error: %s", e)
        return {"score": 0.1, "comment": "Evaluation failed."}


def generate_prompts(count: int) -> list[str]:
    """
    Генерирует уникальные промпты для раундов через Groq.
    При ошибке возвращает дефолтные промпты.

    Returns:
        list[str] длиной count
    """
    text = _groq_text_request(
        PROMPT_GENERATION_PROMPT.format(count=count),
        max_tokens=300,
    )
    if text:
        try:
            prompts = json.loads(text)
            if isinstance(prompts, list) and len(prompts) >= count:
                return [str(p) for p in prompts[:count]]
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("Groq prompts parse error: %s", e)

    logger.warning("Falling back to default prompts")
    return DEFAULT_PROMPTS[:count]
