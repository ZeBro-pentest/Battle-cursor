from django.contrib import admin

from .models import Inventory, Purchase


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("user",)
    search_fields = ("user__username",)
    readonly_fields = ("id",)
    filter_horizontal = ("cursors", "canvases")


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ("user", "item_type", "item_id", "price_paid", "bought_at")
    list_filter = ("item_type",)
    search_fields = ("user__username",)
    readonly_fields = ("id", "bought_at")
