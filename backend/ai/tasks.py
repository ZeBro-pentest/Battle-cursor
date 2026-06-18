import logging

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.core.cache import cache
from game.models import Round, Score

from .services import grade_drawing

logger = logging.getLogger(__name__)
User = get_user_model()


def _collect_drawings_from_redis(round_id: str) -> dict:
    """Собирает все рисунки раунда из Redis."""
    pattern = f"round:{round_id}:drawing:*"
    keys = cache.keys(pattern)
    drawings = {}
    for key in keys:
        user_id = key.split(":")[-1]
        data = cache.get(key)
        if data:
            drawings[user_id] = data
    return drawings


def _delete_drawings_from_redis(round_id: str):
    """Удаляет все рисунки раунда из Redis."""
    pattern = f"round:{round_id}:drawing:*"
    keys = cache.keys(pattern)
    if keys:
        cache.delete_many(keys)
    cache.delete(f"round:{round_id}:task_id")


def _push_results_to_group(room_group: str, round_id: str, scores_data: list):
    """Пушит результаты раунда всем игрокам через channel layer."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        room_group,
        {
            "type": "round_results",
            "round_id": round_id,
            "scores": scores_data,
        },
    )


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def grade_round(self, round_id: str, room_group: str):
    """
    Оценивает рисунки всех игроков за раунд.
    Забирает рисунки из Redis, отправляет в Groq, сохраняет Score в БД,
    пушит результаты через channel layer, чистит Redis.

    Args:
        round_id: UUID раунда (str)
        room_group: название группы channel layer (например "room_ABC123")
    """
    try:
        round_obj = Round.objects.select_related("game").get(id=round_id)
    except Round.DoesNotExist:
        logger.error("Round %s not found", round_id)
        return

    drawings = _collect_drawings_from_redis(round_id)
    if not drawings:
        logger.warning("No drawings found in Redis for round %s", round_id)
        return

    prompt = round_obj.prompt
    scores_data = []

    for user_id, data in drawings.items():
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning("User %s not found, skipping", user_id)
            continue

        image_base64 = data.get("image_base64", "")
        image_url = data.get("image_url", "")

        result = grade_drawing(image_base64, prompt)
        score_value = result["score"]
        comment = result["comment"]
        coins_earned = round(score_value * 10, 1)

        Score.objects.update_or_create(
            user=user,
            round=round_obj,
            defaults={
                "value": score_value,
                "comment": comment,
                "image_url": image_url,
                "coins_earned": coins_earned,
            },
        )

        scores_data.append(
            {
                "user_id": str(user_id),
                "username": user.username,
                "score": score_value,
                "comment": comment,
                "coins_earned": coins_earned,
            }
        )

        logger.info(
            "Graded round=%s user=%s score=%.1f",
            round_id,
            user_id,
            score_value,
        )

    round_obj.is_finished = True
    round_obj.save(update_fields=["is_finished"])

    _delete_drawings_from_redis(round_id)
    _push_results_to_group(room_group, round_id, scores_data)

    logger.info("Round %s graded, %d scores saved", round_id, len(scores_data))
    return {"round_id": round_id, "scores": scores_data}


@shared_task
def force_grade_round(round_id: str, room_group: str):
    """
    Страховочная задача — триггерится через 65 сек после старта раунда.
    Оценивает всех кто успел сдать рисунок, остальные получают 0.1.
    """
    try:
        round_obj = Round.objects.get(id=round_id)
    except Round.DoesNotExist:
        logger.error("force_grade_round: Round %s not found", round_id)
        return

    if round_obj.is_finished:
        logger.info("force_grade_round: Round %s already finished, skipping", round_id)
        return

    logger.info("force_grade_round: triggering grade for round %s", round_id)
    grade_round.delay(round_id, room_group)
