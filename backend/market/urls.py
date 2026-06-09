from django.urls import path

from .views import BuyView, InventoryView, MarketListView, PurchaseHistoryView

urlpatterns = [
    path("", MarketListView.as_view(), name="market-list"),
    path("buy/", BuyView.as_view(), name="market-buy"),
    path("inventory/", InventoryView.as_view(), name="market-inventory"),
    path("purchases/", PurchaseHistoryView.as_view(), name="market-purchases"),
]
