from django.core.exceptions import ValidationError
from users.models import Canvas, Cursor


# Используется: market/services.py
def validate_enough_coins(user, price: int) -> None:
    """
    Проверяет что у пользователя достаточно монет для покупки.
    """
    if user.coins < price:
        raise ValidationError(
            f"Недостаточно монет. Нужно: {price}, у вас: {user.coins}."
        )


# Используется: market/services.py
def validate_not_already_owned(user, item_type: str, item_id) -> None:
    """
    Проверяет что предмет ещё не куплен.
    """
    inventory = user.inventory
    if item_type == "cursor":
        if inventory.cursors.filter(id=item_id).exists():
            raise ValidationError("Этот курсор уже есть в вашем инвентаре.")
    elif item_type == "canvas":
        if inventory.canvases.filter(id=item_id).exists():
            raise ValidationError("Этот холст уже есть в вашем инвентаре.")


# Используется: market/serializers.py
def validate_item_exists(item_type: str, item_id) -> None:
    """
    Проверяет что предмет существует в БД.
    """
    if item_type == "cursor":
        if not Cursor.objects.filter(id=item_id).exists():
            raise ValidationError("Курсор не найден.")
    elif item_type == "canvas":
        if not Canvas.objects.filter(id=item_id).exists():
            raise ValidationError("Холст не найден.")
