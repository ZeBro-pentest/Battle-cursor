from django.core.cache import cache
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import Canvas, Cursor
from users.serializers import CanvasSerializer, CursorSerializer

from .models import Purchase
from .serializers import (
    InventorySerializer,
    PurchaseCreateSerializer,
    PurchaseSerializer,
)
from .services import InventoryService, PurchaseService

MARKET_CACHE_KEY = "market:shop_items"
MARKET_CACHE_TTL = 60 * 60 * 24  # увеличил до 24 часов т.к. у меня есть сигналы


class MarketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cached = cache.get(MARKET_CACHE_KEY)
        if cached:
            return Response(cached)

        data = {
            "cursors": CursorSerializer(Cursor.objects.all(), many=True).data,
            "canvases": CanvasSerializer(Canvas.objects.all(), many=True).data,
        }
        cache.set(MARKET_CACHE_KEY, data, MARKET_CACHE_TTL)
        return Response(data)


class BuyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PurchaseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            purchase = PurchaseService.buy(
                user=request.user,
                item_type=serializer.validated_data["item_type"],
                item_id=serializer.validated_data["item_id"],
            )
            # Инвалидируем кэш инвентаря и истории покупок пользователя после покупки
            cache.delete(f"inventory:{request.user.id}")
            cache.delete(f"purchases:{request.user.id}")
        except ValidationError as e:
            message = e.messages[0] if e.messages else str(e)
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            PurchaseSerializer(purchase).data, status=status.HTTP_201_CREATED
        )


class InventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f"inventory:{request.user.id}"
        cached_inventory = cache.get(cache_key)

        if cached_inventory:
            return Response(cached_inventory)

        inventory = InventoryService.get_inventory(request.user)
        data = InventorySerializer(inventory).data

        # Кэшируем на 1 час
        cache.set(cache_key, data, 60 * 60)
        return Response(data)


class PurchaseHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f"purchases:{request.user.id}"
        cached_purchases = cache.get(cache_key)

        if cached_purchases:
            return Response(cached_purchases)

        purchases = Purchase.objects.filter(user=request.user)
        data = PurchaseSerializer(purchases, many=True).data

        # Кэшируем на 1 час
        cache.set(cache_key, data, 60 * 60)
        return Response(data)
