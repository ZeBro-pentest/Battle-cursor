from django.db.models import F, Sum

# для TODO на 27 строке
from game.models import Game, Round, Score
from game.repository import GameRepository, RoundRepository, ScoreRepository


class GameService:
    @staticmethod
    def create(players, max_players=8):
        game = GameRepository.create_game(players=players, max_players=max_players)
        GameRepository.update_started(game)
        return game

    @staticmethod
    def finish(game):
        GameRepository.update_done(game)
        ScoreService.sync_coins_to_db(game)
        return game

    @staticmethod
    def get_current_round(game):
        return RoundRepository.get_current_round(game)

    @staticmethod
    def _generate_prompts(count):
        # TODO: заменить на Gemini генерацию промптов
        defaults = [
            "Нарисуй кота",
            "Нарисуй дом",
            "Нарисуй машину",
            "Нарисуй дерево",
            "Нарисуй солнце",
            "Нарисуй рыбу",
            "Нарисуй цветок",
            "Нарисуй гору",
        ]
        return defaults[:count]


class RoundService:
    @staticmethod
    def create(game, number, prompt):
        return RoundRepository.create_round(
            game=game,
            number=number,
            prompt=prompt,
        )

    @staticmethod
    def finish(round_obj):
        return RoundRepository.finish_round(round_obj)


class ScoreService:
    @staticmethod
    def create(user, round_obj, value, comment):
        coins_earned = round(value * 10, 1)
        return ScoreRepository.create_score(
            user=user,
            round_obj=round_obj,
            value=value,
            comment=comment,
            coins_earned=coins_earned,
        )

    @staticmethod
    def sync_coins_to_db(game):
        from django.contrib.auth import get_user_model

        User = get_user_model()

        scores = (
            Score.objects.filter(round__game=game)
            .values("user_id")
            .annotate(total_coins=Sum("coins_earned"))
        )

        for entry in scores:
            User.objects.filter(id=entry["user_id"]).update(
                coins=F("coins") + entry["total_coins"]
            )

        winner = scores.order_by("-total_coins").first()
        if winner:
            User.objects.filter(id=winner["user_id"]).update(rating=F("rating") + 1)
