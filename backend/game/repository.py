from game.models import Game, Round, Score


class GameRepository:
    @staticmethod
    def create_game(players, max_players):
        game = Game.objects.create(max_players=max_players)
        game.players.set(players)
        return game

    @staticmethod
    def get_by_id(game_id):
        return Game.objects.filter(id=game_id).first()

    @staticmethod
    def update_started(game):
        game.started = True
        game.save(update_fields=["started"])

    @staticmethod
    def update_done(game):
        game.done = True
        game.save(update_fields=["done"])


class RoundRepository:
    @staticmethod
    def create_round(game, number, prompt):
        return Round.objects.create(game=game, number=number, prompt=prompt)

    @staticmethod
    def get_current_round(game):
        return game.rounds.filter(is_finished=False).first()

    @staticmethod
    def finish_round(round_obj):
        from django.utils import timezone

        round_obj.is_finished = True
        round_obj.ended_at = timezone.now()
        round_obj.save(update_fields=["is_finished", "ended_at"])


class ScoreRepository:
    @staticmethod
    def create_score(user, round_obj, value, comment, coins_earned):
        return Score.objects.create(
            user=user,
            round=round_obj,
            value=value,
            comment=comment,
            coins_earned=coins_earned,
        )

    @staticmethod
    def get_scores_by_round(round_obj):
        return Score.objects.filter(round=round_obj).select_related("user")
