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
)

logger = logging.getLogger(__name__)


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
