from django.utils import timezone

from .models import Game, Round, Score
from .validators import (
    validate_game_not_full,
    validate_game_not_started,
    validate_player_not_in_game,
)


class GameService:
    @staticmethod
    def create(owner, validated_data: dict) -> Game:
        """
        Создаёт игру и добавляет хоста как первого игрока.
        """
        game = Game.objects.create(
            owner=owner,
            max_players=validated_data.get("max_players", 8),
        )
        game.players.add(owner)
        return game

    @staticmethod
    def join(game: Game, user) -> Game:
        """
        Добавляет игрока в игру.
        """
        validate_game_not_started(game)
        validate_game_not_full(game)
        validate_player_not_in_game(game, user)
        game.players.add(user)
        return game

    @staticmethod
    def start(game: Game, user) -> Game:
        """
        Запускает игру — только хост может начать.
        """
        if game.owner != user:
            from django.core.exceptions import ValidationError

            raise ValidationError("Только хост может начать игру.")
        if game.players.count() < 2:
            from django.core.exceptions import ValidationError

            raise ValidationError("Недостаточно игроков для начала игры.")
        game.started = True
        game.save(update_fields=["started"])
        return game

    @staticmethod
    def finish(game: Game) -> Game:
        """
        Завершает игру и синхронизирует монеты с БД.
        """
        game.done = True
        game.save(update_fields=["done"])
        ScoreService.sync_coins_to_db(game)
        return game


class RoundService:
    @staticmethod
    def create(game: Game, number: int, prompt: str) -> Round:
        """
        Создаёт новый раунд с prompt от Gemini.
        """
        round_ = Round.objects.create(
            game=game,
            number=number,
            prompt=prompt,
            started_at=timezone.now(),
        )
        return round_

    @staticmethod
    def finish(round_: Round) -> Round:
        """
        Завершает раунд.
        """
        round_.is_finished = True
        round_.ended_at = timezone.now()
        round_.save(update_fields=["is_finished", "ended_at"])
        return round_


class ScoreService:
    @staticmethod
    def create(user, round_: Round, value: float, comment: str) -> Score:
        """
        Создаёт Score и начисляет монеты в Redis.
        """
        coins_earned = round(value * 10, 1)
        score = Score.objects.create(
            user=user,
            round=round_,
            value=value,
            comment=comment,
            coins_earned=coins_earned,
        )
        return score

    @staticmethod
    def sync_coins_to_db(game: Game) -> None:
        """
        Синхронизирует монеты из Redis в БД после завершения игры.
        Вызывается из GameService.finish()
        """
        from django.contrib.auth import get_user_model

        User = get_user_model()

        scores = (
            Score.objects.filter(round__game=game)
            .values("user_id")
            .annotate(
                total_coins=__import__("django.db.models", fromlist=["Sum"]).Sum(
                    "coins_earned"
                )
            )
        )

        for entry in scores:
            User.objects.filter(id=entry["user_id"]).update(
                coins=__import__("django.db.models", fromlist=["F"]).F("coins")
                + entry["total_coins"]
            )

        winner = scores.order_by("-total_coins").first()
        if winner:
            User.objects.filter(id=winner["user_id"]).update(
                wins=__import__("django.db.models", fromlist=["F"]).F("wins") + 1
            )
