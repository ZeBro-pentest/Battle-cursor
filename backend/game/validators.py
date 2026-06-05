from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator

# Используется: game/models.py
max_players_validator = [
    MinValueValidator(2, message="Минимум 2 игрока."),
    MaxValueValidator(8, message="Максимум 8 игроков."),
]


# Используется: game/models.py
def validate_prompt(value: str) -> None:
    """
    Задание для раунда:
    - не пустое
    - от 3 до 100 символов
    """
    if not value or not value.strip():
        raise ValidationError("Задание не может быть пустым.")
    if len(value.strip()) < 3:
        raise ValidationError("Задание должно содержать минимум 3 символа.")
    if len(value.strip()) > 100:
        raise ValidationError("Задание не должно превышать 100 символов.")


# Используется: game/services.py
def validate_game_not_started(game) -> None:
    """
    Нельзя присоединиться к уже начатой или завершённой игре.
    """
    if game.started:
        raise ValidationError("Игра уже началась.")
    if game.done:
        raise ValidationError("Игра уже завершена.")


# Используется: game/services.py
def validate_player_not_in_game(game, user) -> None:
    """
    Нельзя присоединиться к игре дважды.
    """
    if game.players.filter(id=user.id).exists():
        raise ValidationError("Вы уже находитесь в этой игре.")


# Используется: game/services.py
def validate_game_not_full(game) -> None:
    """
    Нельзя присоединиться если игра заполнена.
    """
    if game.players.count() >= game.max_players:
        raise ValidationError("Игра заполнена.")
