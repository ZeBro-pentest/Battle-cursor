import uuid

from django.conf import settings
from django.db import models
from users.models import Canvas, Cursor


class Inventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inventory"
    )
    cursors = models.ManyToManyField(Cursor, blank=True, related_name="inventories")
    canvases = models.ManyToManyField(Canvas, blank=True, related_name="inventories")

    class Meta:
        db_table = "inventories"

    def __str__(self):
        return f"{self.user.username} — inventory"


class Purchase(models.Model):
    class ItemType(models.TextChoices):
        CURSOR = "cursor", "Cursor"
        CANVAS = "canvas", "Canvas"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="purchases"
    )
    item_type = models.CharField(max_length=10, choices=ItemType.choices)
    item_id = models.UUIDField()
    price_paid = models.PositiveIntegerField()
    bought_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "purchases"
        ordering = ["-bought_at"]

    def __str__(self):
        return f"{self.user.username} — {self.item_type} {self.item_id}"
