from rest_framework import serializers
from users.serializers import CanvasSerializer, CursorSerializer

from .models import Inventory, Purchase


class InventorySerializer(serializers.ModelSerializer):
    cursors = CursorSerializer(many=True, read_only=True)
    canvases = CanvasSerializer(many=True, read_only=True)

    class Meta:
        model = Inventory
        fields = ["id", "cursors", "canvases"]
        read_only_fields = fields


class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = ["id", "item_type", "item_id", "price_paid", "bought_at"]
        read_only_fields = fields


class PurchaseCreateSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=["cursor", "canvas"])
    item_id = serializers.UUIDField()

    def validate(self, data):
        from .validators import validate_item_exists

        validate_item_exists(data["item_type"], data["item_id"])
        return data
