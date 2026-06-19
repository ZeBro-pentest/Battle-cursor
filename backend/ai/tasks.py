import logging

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.core.cache import cache
from game.models import Game, Round, Score
from game.services import GameService, RoundService

from .services import grade_drawing

logger = logging.getLogger(__name__)
User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _push(room_group: str, payload: dict):
    """Пушит событие всем игрокам в группе."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(room_group, payload)


def _collect_drawings(round_id: str) -> dict:
    """Собирает все рисунки раунда из Redis. {user_id: {image_base64, image_url}}"""
    keys = cache.keys(f"round:{round_id}:drawing:*")
    drawings = {}
    for key in keys:
        user_id = key.split(":")[-1]
        data = cache.get(key)
        if data:
            drawings[user_id] = data
    return drawings


def _cleanup_round(round_id: str):
    """Удаляет рисунки и task_id раунда из Redis."""
    keys = cache.keys(f"round:{round_id}:drawing:*")
    if keys:
        cache.delete_many(keys)
    cache.delete(f"round:{round_id}:task_id")


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


@shared_task
def start_round(round_id: str, game_id: str, room_group: str):
    """
    Стартует раунд:
    - пушит фронту round_started с промптом и таймером
    - ставит страховочную задачу force_grade_round через 65 сек
    - сохраняет task_id страховки в Redis
    """
    try:
        round_obj = Round.objects.get(id=round_id)
    except Round.DoesNotExist:
        logger.error("start_round: Round %s not found", round_id)
        return

    # Страховочная задача через 65 сек
    task = force_grade_round.apply_async(
        args=[round_id, room_group],
        countdown=65,
    )
    cache.set(f"round:{round_id}:task_id", task.id, timeout=120)

    _push(
        room_group,
        {
            "type": "round_started",
            "round_id": str(round_obj.id),
            "round_number": round_obj.number,
            "prompt": round_obj.prompt,
            "duration": 60,
        },
    )

    logger.info("Round %s started (game=%s)", round_id, game_id)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def grade_round(self, round_id: str, room_group: str):
    """
    Оценивает рисунки всех игроков за раунд.
    После оценки запускает следующий раунд или game_over.
    """
    try:
        round_obj = Round.objects.select_related("game").get(id=round_id)
    except Round.DoesNotExist:
        logger.error("grade_round: Round %s not found", round_id)
        return

    if round_obj.is_finished:
        logger.warning("grade_round: Round %s already finished", round_id)
        return

    drawings = _collect_drawings(round_id)
    if not drawings:
        logger.warning("grade_round: No drawings for round %s", round_id)

    prompt = round_obj.prompt
    scores_data = []

    for user_id, data in drawings.items():
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning("grade_round: User %s not found, skipping", user_id)
            continue

        result = grade_drawing(data.get("image_base64", ""), prompt)
        score_value = result["score"]
        comment = result["comment"]
        coins_earned = round(score_value * 10, 1)

        Score.objects.update_or_create(
            user=user,
            round=round_obj,
            defaults={
                "value": score_value,
                "comment": comment,
                "image_url": data.get("image_url", ""),
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
            "Graded round=%s user=%s score=%.1f", round_id, user_id, score_value
        )

    RoundService.finish(round_obj)
    _cleanup_round(round_id)

    # Пушим результаты раунда фронту
    _push(
        room_group,
        {
            "type": "round_results",
            "round_id": round_id,
            "round_number": round_obj.number,
            "scores": scores_data,
        },
    )

    logger.info("Round %s graded, %d scores saved", round_id, len(scores_data))

    # Определяем следующий раунд
    game = round_obj.game
    next_round = Round.objects.filter(
        game=game, number=round_obj.number + 1, is_finished=False
    ).first()

    if next_round:
        # Пауза 5 сек (игроки смотрят результаты) → следующий раунд
        start_round.apply_async(
            args=[str(next_round.id), str(game.id), room_group],
            countdown=5,
        )
    else:
        # Все раунды завершены → итоги
        game_over.apply_async(
            args=[str(game.id), room_group],
            countdown=5,
        )


@shared_task
def force_grade_round(round_id: str, room_group: str):
    """
    Страховочная задача — триггерится через 65 сек после старта раунда.
    Пропускает если раунд уже завершён.
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


@shared_task
def game_over(game_id: str, room_group: str):
    """
    Завершает игру:
    - считает итоговые очки по всем раундам
    - синхронизирует монеты и рейтинг в БД
    - пушит финальные результаты фронту
    """
    try:
        game = Game.objects.prefetch_related("rounds__scores__user").get(id=game_id)
    except Game.DoesNotExist:
        logger.error("game_over: Game %s not found", game_id)
        return

    # Итоговые результаты по каждому игроку
    from django.db.models import Sum

    totals = (
        Score.objects.filter(round__game=game)
        .values("user__id", "user__username")
        .annotate(total_score=Sum("value"), total_coins=Sum("coins_earned"))
        .order_by("-total_score")
    )

    final_scores = [
        {
            "user_id": str(entry["user__id"]),
            "username": entry["user__username"],
            "total_score": entry["total_score"],
            "total_coins": entry["total_coins"],
        }
        for entry in totals
    ]

    # Завершаем игру + синхронизируем монеты в БД
    GameService.finish(game)

    # Чистим players_count из Redis
    cache.delete(f"game:{game_id}:players_count")

    _push(
        room_group,
        {
            "type": "game_over",
            "game_id": game_id,
            "final_scores": final_scores,
        },
    )

    logger.info(
        "Game %s over. Winner: %s",
        game_id,
        final_scores[0]["username"] if final_scores else "?",
    )
