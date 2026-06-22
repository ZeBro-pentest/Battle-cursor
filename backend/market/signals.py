from django.conf import settings
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .views import MARKET_CACHE_KEY


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_inventory(sender, instance, created, **kwargs):
    if created:
        from market.models import Inventory

        Inventory.objects.get_or_create(user=instance)


@receiver(post_save, sender="users.Cursor")
@receiver(post_delete, sender="users.Cursor")
@receiver(post_save, sender="users.Canvas")
@receiver(post_delete, sender="users.Canvas")
def clear_market_cache(sender, instance, **kwargs):
    cache.delete(MARKET_CACHE_KEY)
