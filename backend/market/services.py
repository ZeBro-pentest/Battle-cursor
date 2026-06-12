from django.db import transaction
from django.core.exceptions import ValidationError
from users.models import Canvas, Cursor

from .models import Inventory, Purchase
from .validators import validate_enough_coins, validate_not_already_owned


class PurchaseService:
    @staticmethod
    def buy(user, item_type: str, item_id) -> Purchase:
        """
        Покупает курсор или холст.
        Проверяет монеты, дубликат, списывает монеты, добавляет в инвентарь.
        Использует transaction.atomic для защиты от частичных обновлений.
        """
        item = PurchaseService._get_item(item_type, item_id)

        validate_enough_coins(user, item.price)
        validate_not_already_owned(user, item_type, item_id)

        with transaction.atomic():
            # 🔒 Атомарная операция: списание денег, создание чека и выдача предмета
            user.coins -= item.price
            user.save(update_fields=["coins"])

            purchase = Purchase.objects.create(
                user=user,
                item_type=item_type,
                item_id=item_id,
                price_paid=item.price,
            )

            InventoryService.add_item(user.inventory, item_type, item)

            return purchase

    @staticmethod
    def _get_item(item_type: str, item_id):
        """
        Возвращает объект курсора или холста по типу и id.
        """
        try:
            if item_type == "cursor":
                return Cursor.objects.get(id=item_id)
            elif item_type == "canvas":
                return Canvas.objects.get(id=item_id)
        except (Cursor.DoesNotExist, Canvas.DoesNotExist):
            raise ValidationError("Предмет не найден.")


class InventoryService:
    @staticmethod
    def add_item(inventory: Inventory, item_type: str, item) -> None:
        """
        Добавляет предмет в инвентарь пользователя.
        """
        if item_type == "cursor":
            inventory.cursors.add(item)
        elif item_type == "canvas":
            inventory.canvases.add(item)

    @staticmethod
    def get_inventory(user) -> Inventory:
        """
        Возвращает инвентарь пользователя.
        """
        return user.inventory
