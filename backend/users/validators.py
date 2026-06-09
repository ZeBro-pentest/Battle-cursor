from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxLengthValidator,
    MinLengthValidator,
    RegexValidator,
)
from game.debuffs import DEBUFFS

VALID_DEBUFF_IDS = {d["id"] for d in DEBUFFS}

# Используется: users/models.py
username_validator = RegexValidator(
    regex=r"^[a-zA-Z0-9_-]+$",
    message="Имя пользователя может содержать только буквы, цифры, _ и -.",
)

username_min_length = MinLengthValidator(
    3, message="Имя пользователя должно содержать минимум 3 символа."
)

username_max_length = MaxLengthValidator(
    24, message="Имя пользователя не должно превышать 24 символа."
)


# Используется: users/serializers.py
def validate_password_strength(value: str) -> None:
    """
    Пароль:
    - минимум 8 символов
    - минимум одна цифра
    - минимум одна буква
    - минимум один спецсимвол
    """
    import re

    if not re.search(r"[0-9]", value):
        raise ValidationError("Пароль должен содержать минимум одну цифру.")
    if not re.search(r"[a-zA-Z]", value):
        raise ValidationError("Пароль должен содержать минимум одну букву.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
        raise ValidationError("Пароль должен содержать минимум один спецсимвол.")


# Используется: users/models.py
def validate_debuffs_list(value: list) -> None:
    """
    Список дебаффов — каждый элемент должен быть валидным id из debuffs.py
    """
    if not isinstance(value, list):
        raise ValidationError("Дебаффы должны быть списком.")
    if len(value) > 5:
        raise ValidationError("Максимум 5 дебаффов.")
    invalid = [d for d in value if d not in VALID_DEBUFF_IDS]
    if invalid:
        raise ValidationError(
            f"Невалидные дебаффы: {invalid}. Доступные: {list(VALID_DEBUFF_IDS)}"
        )
