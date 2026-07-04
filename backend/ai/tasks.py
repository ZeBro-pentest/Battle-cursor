import logging

import cloudinary.api
import cloudinary.uploader
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
    drawings = {}
    for key in cache.iter_keys(f"round:{round_id}:drawing:*"):
        user_id = key.split(":")[-1]
        data = cache.get(key)
        if data:
            drawings[user_id] = data
    return drawings


def _cleanup_round(round_id: str):
    """Удаляет рисунки и task_id раунда из Redis."""
    keys = list(cache.iter_keys(f"round:{round_id}:drawing:*"))
    if keys:
        cache.delete_many(keys)
    cache.delete(f"round:{round_id}:task_id")
    cache.delete(f"round:{round_id}:submitted")


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

    from django.utils import timezone
    round_obj.started_at = timezone.now()
    round_obj.save(update_fields=["started_at"])

    # Страховочная задача через 65 сек
    task = force_grade_round.apply_async(
        args=[round_id, room_group],
        countdown=65,
    )
    cache.set(f"round:{round_id}:task_id", task.id, timeout=120)

    # Чистим активные дебаффы и использованные дебаффы перед новым раундом
    try:
        game_obj = Game.objects.select_related("server").prefetch_related("server__players").get(id=game_id)
        for player in game_obj.server.players.all():
            cache.delete(f"game:{game_id}:debuff_active:{player.id}")
        used_keys = list(cache.iter_keys(f"game:{game_id}:used_debuff:*"))
        if used_keys:
            cache.delete_many(used_keys)
    except Exception:
        pass

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
    from django.db import transaction

    try:
        round_obj = Round.objects.select_related("game").get(id=round_id)
    except Round.DoesNotExist:
        logger.error("grade_round: Round %s not found", round_id)
        return

    if round_obj.is_finished:
        logger.warning("grade_round: Round %s already finished", round_id)
        return

    # Redis lock предотвращает двойной запуск (race между grade_round и force_grade_round)
    lock_key = f"round:{round_id}:grading_lock"
    if cache.get(lock_key):
        logger.warning("grade_round: Round %s already being graded, skipping", round_id)
        return
    cache.set(lock_key, 1, timeout=120)

    drawings = _collect_drawings(round_id)
    if not drawings:
        logger.warning("grade_round: No drawings for round %s, skipping grading", round_id)
        return

    # Фаза 1: HTTP-запросы к Groq — до транзакции
    prompt = round_obj.prompt
    scores_data = []
    db_scores = []

    for user_id, data in drawings.items():
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning("grade_round: User %s not found, skipping", user_id)
            continue

        image_base64 = data.get("image_base64", "")
        image_url = data.get("image_url", "")

        # Upload drawing to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(
                f"data:image/png;base64,{image_base64}",
                folder="drawings",
                public_id=f"{round_id}_{user_id}",
                resource_type="image",
            )
            image_url = upload_result.get("secure_url", "")
        except Exception as e:
            logger.error("Cloudinary upload failed: %s", e)
            image_url = ""

        result = grade_drawing(image_base64, prompt)
        score_value = result["score"]
        comment = result["comment"]
        coins_earned = round(score_value * 10, 1)

        db_scores.append({
            "user": user,
            "value": score_value,
            "comment": comment,
            "image_url": image_url,
            "coins_earned": coins_earned,
        })
        scores_data.append({
            "user_id": str(user_id),
            "username": user.username,
            "score": score_value,
            "comment": comment,
            "coins_earned": coins_earned,
            "image_url": image_url,
        })
        logger.info("Graded round=%s user=%s score=%.1f", round_id, user_id, score_value)

    # Фаза 2: атомарная запись в БД + dispatch следующей задачи через on_commit
    game = round_obj.game

    game_id_str = str(game.id)

    with transaction.atomic():
        for s in db_scores:
            Score.objects.update_or_create(
                user=s["user"],
                round=round_obj,
                defaults={
                    "value": s["value"],
                    "comment": s["comment"],
                    "image_url": s["image_url"],
                    "coins_earned": s["coins_earned"],
                },
            )
        RoundService.finish(round_obj)

        # Фаза 3: накапливаем монеты в Redis внутри транзакции — атомарно с записью Score
        for s in db_scores:
            coin_key = f"game:{game_id_str}:coins:{s['user'].id}"
            current = cache.get(coin_key, 0.0)
            cache.set(coin_key, current + s["coins_earned"], timeout=3600)

        next_round = Round.objects.filter(
            game=game, number=round_obj.number + 1, is_finished=False
        ).first()

        if next_round:
            next_id, game_id = str(next_round.id), game_id_str
            transaction.on_commit(
                lambda nid=next_id, gid=game_id: start_round.apply_async(args=[nid, gid, room_group], countdown=10)
            )
        else:
            transaction.on_commit(
                lambda gid=game_id_str: game_over.apply_async(args=[gid, room_group], countdown=10)
            )

    _cleanup_round(round_id)

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
    from django.db import transaction

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

    with transaction.atomic():
        # Завершаем игру + синхронизируем монеты в БД
        GameService.finish(game)

        # Удаляем Server из БД
        try:
            from servers.models import Server

            server = Server.objects.get(game_id=game_id)
            room_code = server.room_code
            server.delete()
            logger.info("game_over: Server %s deleted", room_code)
        except Exception as e:
            logger.warning("game_over: Server not found or already deleted: %s", e)

        # Удаляем Game через 10 минут — только после коммита
        transaction.on_commit(
            lambda: delete_game.apply_async(args=[game_id], countdown=120)
        )

    # Чистим Redis
    cache.delete(f"game:{game_id}:players_count")
    debuff_keys = list(cache.iter_keys(f"game:{game_id}:debuff_active:*"))
    if debuff_keys:
        cache.delete_many(debuff_keys)

    _push(
        room_group,
        {
            "type": "game_over",
            "game_id": game_id,
            "final_scores": final_scores,
        },
    )

    cleanup_drawings.apply_async(args=[game_id], countdown=30)

    logger.info(
        "Game %s over. Winner: %s",
        game_id,
        final_scores[0]["username"] if final_scores else "?",
    )


@shared_task
def kick_offline_player(game_id: str, room_group: str, user_id: str, room_code: str):
    """Кикает игрока если он не переподключился за 30 сек во время игры."""
    if not cache.get(f"game:{game_id}:offline:{user_id}"):
        logger.info("kick_offline_player: player %s reconnected, skip kick", user_id)
        return

    from servers.models import Server

    try:
        server = Server.objects.get(room_code=room_code)
        user = User.objects.get(id=user_id)
        server.players.remove(user)
        logger.info("kick_offline_player: player %s kicked from game %s (offline 30s)", user_id, game_id)
    except Exception as e:
        logger.error("kick_offline_player error: %s", e)
        return

    _push(
        room_group,
        {
            "type": "player_left",
            "user_id": user_id,
            "kicked": True,
        },
    )
    cache.delete(f"game:{game_id}:offline:{user_id}")


@shared_task
def delete_game(game_id: str):
    """Удаляет Game (и связанные Round, Score) через 10 минут после завершения."""
    try:
        game = Game.objects.get(id=game_id)
        game.delete()
        logger.info("delete_game: Game %s deleted", game_id)
    except Game.DoesNotExist:
        logger.info("delete_game: Game %s already deleted", game_id)


@shared_task
def cleanup_drawings(game_id: str):
    """Удаляет рисунки из Cloudinary для всех раундов игры (вызывается через 10 мин после game_over)."""
    logger.info("cleanup_drawings called for game_id=%s", game_id)
    try:
        rounds = Round.objects.filter(game_id=game_id)
        for round_obj in rounds:
            try:
                cloudinary.api.delete_resources_by_prefix(f"drawings/{round_obj.id}_")
            except Exception as e:
                logger.warning("cleanup_drawings: Cloudinary failed for round %s: %s", round_obj.id, e)
        logger.info("cleanup_drawings: done for game %s", game_id)
    except Exception as e:
        logger.error("cleanup_drawings: error for game %s: %s", game_id, e)


@shared_task
def cleanup_game(game_id: str, room_code: str):
    """Вызывается когда все игроки отключились после завершённой игры."""
    logger.info("cleanup_game called for game_id=%s", game_id)
    from servers.models import Server

    # Удаляем рисунки из Cloudinary для всех раундов игры
    try:
        from game.models import Round
        rounds = Round.objects.filter(game_id=game_id)
        for round_obj in rounds:
            try:
                cloudinary.api.delete_resources_by_prefix(
                    f"drawings/{round_obj.id}_"
                )
            except Exception as e:
                logger.warning("Cloudinary cleanup failed for round %s: %s", round_obj.id, e)
    except Exception as e:
        logger.error("cleanup_game drawings error: %s", e)

    keys = list(cache.iter_keys(f"game:{game_id}:*"))
    if keys:
        cache.delete_many(keys)

    try:
        server = Server.objects.get(room_code=room_code)
        server.delete()
        logger.info("cleanup_game: Server %s deleted", room_code)
    except Server.DoesNotExist:
        logger.info("cleanup_game: Server %s already deleted", room_code)
