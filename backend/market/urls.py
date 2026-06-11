from django.urls import path

from .views import BuyView, InventoryView, MarketListView, PurchaseHistoryView

urlpatterns = [
    # все товары
    path("", MarketListView.as_view(), name="market-list"),
    # покупка товара
    path("buy/", BuyView.as_view(), name="market-buy"),
    # получаем кешированный инвентарь
    path("inventory/", InventoryView.as_view(), name="market-inventory"),
    # получаем кешированный список покупок (чеки)
    path("purchases/", PurchaseHistoryView.as_view(), name="market-purchases"),
]
