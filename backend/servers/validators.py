from django.core.exceptions import ValidationError

from servers.config import MAX_PLAYERS, MIN_PLAYERS


def validate_max_players(value):
    if value < MIN_PLAYERS or value > MAX_PLAYERS:
        raise ValidationError(
            f"Количество игроков должно быть от {MIN_PLAYERS} до {MAX_PLAYERS}."
        )


def validate_room_not_full(server):
    if server.players.count() >= server.max_players:
        raise ValidationError("Комната заполнена.")


def validate_game_not_started(server):
    if server.status != server.StatusChoices.WAITING:
        raise ValidationError("Игра уже началась.")


def validate_single_session(user):
    from servers.models import Server

    if Server.objects.filter(
        players=user,
        status__in=[Server.StatusChoices.WAITING, Server.StatusChoices.IN_PROGRESS],
    ).exists():
        raise ValidationError("Вы уже находитесь в другой комнате.")
