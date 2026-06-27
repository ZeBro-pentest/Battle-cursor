import logging

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.core.cache import cache

logger = logging.getLogger(__name__)


def _push(room_group: str, payload: dict):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(room_group, payload)


@shared_task
def delete_server_if_host_absent(room_code: str, room_group: str):
    if not cache.get(f"server:{room_code}:host_disconnected"):
        return
    from servers.models import Server

    try:
        server = Server.objects.get(room_code=room_code)
        server.delete()
        logger.info("Server %s deleted: host absent for 10s", room_code)
    except Server.DoesNotExist:
        pass
    cache.delete(f"server:{room_code}:host_disconnected")
    try:
        _push(room_group, {"type": "server_deleted", "reason": "host_left"})
    except Exception:
        pass
