from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .views import MARKET_CACHE_KEY


@receiver(post_save, sender="users.Cursor")
@receiver(post_delete, sender="users.Cursor")
@receiver(post_save, sender="users.Canvas")
@receiver(post_delete, sender="users.Canvas")
def clear_market_cache(sender, instance, **kwargs):
    """
    При изменении или удалении Курсоров/Холстов из приложения users,
    этот сигнал автоматически очистит кэш магазина в приложении market.
    """
    cache.delete(MARKET_CACHE_KEY)
