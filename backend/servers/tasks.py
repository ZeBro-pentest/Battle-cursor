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
def cleanup_offline_waiting_players():
    """Каждые 30 сек кикает офлайн игроков из WAITING комнат (dirty disconnect)."""
    from servers.models import Server

    waiting_servers = Server.objects.filter(
        status=Server.StatusChoices.WAITING
    ).prefetch_related("players")

    for server in waiting_servers:
        for player in server.players.all():
            if not cache.get(f"user:{player.id}:online"):
                server.players.remove(player)
                logger.info(
                    "cleanup_offline_waiting_players: kicked %s from WAITING server %s",
                    player.id,
                    server.room_code,
                )


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
