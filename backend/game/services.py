from django.core.cache import cache
from django.db.models import F

from game.repository import GameRepository, RoundRepository


class GameService:
    @staticmethod
    def create(players, max_players=8):
        game = GameRepository.create_game(players=players, max_players=max_players)
        GameRepository.update_started(game)
        return game

    @staticmethod
    def finish(game):
        GameRepository.update_done(game)
        ScoreService.sync_coins_from_redis(game)
        return game

    @staticmethod
    def get_current_round(game):
        return RoundRepository.get_current_round(game)

    @staticmethod
    def _generate_prompts(count):
        from ai.services import generate_prompts

        return generate_prompts(count)


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
    def sync_coins_from_redis(game):
        from django.contrib.auth import get_user_model

        User = get_user_model()

        max_coins = 0.0
        winner_id = None

        for player in game.players.all():
            coin_key = f"game:{game.id}:coins:{player.id}"
            redis_coins = cache.get(coin_key)
            if redis_coins:
                User.objects.filter(id=player.id).update(
                    coins=F("coins") + redis_coins
                )
                if redis_coins > max_coins:
                    max_coins = redis_coins
                    winner_id = player.id
            cache.delete(coin_key)

        if winner_id:
            User.objects.filter(id=winner_id).update(rating=F("rating") + 1)
