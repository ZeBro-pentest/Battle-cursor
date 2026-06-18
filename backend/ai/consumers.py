import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache

logger = logging.getLogger(__name__)

ONLINE_TTL = 20
DRAWING_TTL = 300  # 5 минут


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"].get("room_code")
        self.room_group = f"room_{self.room_code}"
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        server = await self.get_server()
        if not server:
            await self.close(code=4004)
            return

        if not await self.is_player_in_server(server):
            await self.close(code=4003)
            return

        await self.set_online(True)
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "player_joined",
                "user_id": str(self.user.id),
                "username": self.user.username,
            },
        )

    async def disconnect(self, close_code):
        if (
            hasattr(self, "room_group")
            and hasattr(self, "user")
            and self.user.is_authenticated
        ):
            await self.set_online(False)

            server = await self.get_server()
            if server and server.status == server.StatusChoices.WAITING:
                await self.leave_server()
                server = await self.get_server()

            if server:
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "player_left",
                        "user_id": str(self.user.id),
                        "username": self.user.username,
                    },
                )
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        await self.set_online(True)
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "Неверный формат JSON."}
                )
            )
            return

        event_type = data.get("type")
        handlers = {
            "cursor_move": self.handle_cursor_move,
            "draw": self.handle_draw,
            "ping": self.handle_ping,
            "game_start": self.handle_game_start,
            "round_end": self.handle_round_end,
        }
        handler = handlers.get(event_type)
        if handler:
            await handler(data)
        else:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "detail": f"Неизвестный тип события: {event_type}",
                    }
                )
            )

    # --- Handlers ---

    async def handle_cursor_move(self, data):
        if data.get("x") is None or data.get("y") is None:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "Отсутствуют координаты x или y."}
                )
            )
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "cursor_update",
                "user_id": str(self.user.id),
                "username": self.user.username,
                "x": data.get("x"),
                "y": data.get("y"),
                "cursor_id": data.get("cursor_id"),
            },
        )

    async def handle_draw(self, data):
        if not data.get("stroke"):
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "Отсутствуют данные stroke."}
                )
            )
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "draw_update",
                "user_id": str(self.user.id),
                "stroke": data.get("stroke"),
            },
        )

    async def handle_ping(self, data):
        await self.send(
            text_data=json.dumps({"type": "pong", "timestamp": data.get("timestamp")})
        )

    async def handle_game_start(self, data):
        server = await self.get_server()
        if not server:
            await self.send(
                text_data=json.dumps({"type": "error", "detail": "Комната не найдена."})
            )
            return
        if server.host_id != self.user.id:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "Только хост может начать игру."}
                )
            )
            return
        try:
            game = await self.start_game()
        except ValueError as e:
            await self.send(text_data=json.dumps({"type": "error", "detail": str(e)}))
            return

        # Сохраняем players_count в Redis
        players_count = await self.get_players_count()
        await self.cache_set(
            f"game:{game.id}:players_count", players_count, timeout=3600
        )

        # Пушим game_start всем
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "game_start",
                "room_code": self.room_code,
                "game_id": str(game.id),
            },
        )

        # Стартуем первый раунд через Celery
        first_round = await self.get_first_round(game)
        if first_round:
            from ai.tasks import start_round

            start_round.delay(str(first_round.id), str(game.id), self.room_group)

    async def handle_round_end(self, data):
        """
        Игрок сдаёт рисунок.
        Ожидает: {"type": "round_end", "round_id": "...", "image_base64": "...", "image_url": "..."}
        """
        round_id = data.get("round_id")
        image_base64 = data.get("image_base64", "")
        image_url = data.get("image_url", "")

        if not round_id or not image_base64:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "detail": "Отсутствуют round_id или image_base64.",
                    }
                )
            )
            return

        # Сохраняем рисунок в Redis
        await self.cache_set(
            f"round:{round_id}:drawing:{self.user.id}",
            {"image_base64": image_base64, "image_url": image_url},
            timeout=DRAWING_TTL,
        )

        # Считаем сколько сдали
        submitted = await self.count_submitted(round_id)

        # Берём players_count — нужен game_id
        game_id = await self.get_game_id_for_round(round_id)
        players_count = await self.cache_get(f"game:{game_id}:players_count")

        logger.info(
            "round_end: round=%s user=%s submitted=%d/%s",
            round_id,
            self.user.id,
            submitted,
            players_count,
        )

        if players_count and submitted >= players_count:
            # Все сдали — отменяем страховку и грейдим
            await self.cancel_force_task(round_id)
            from ai.tasks import grade_round

            grade_round.delay(round_id, self.room_group)
            logger.info("All submitted for round %s, grade_round triggered", round_id)

    # --- Group event handlers ---

    async def player_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_left(self, event):
        await self.send(text_data=json.dumps(event))

    async def cursor_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def draw_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def game_start(self, event):
        await self.send(text_data=json.dumps(event))

    async def round_started(self, event):
        await self.send(text_data=json.dumps(event))

    async def round_results(self, event):
        await self.send(text_data=json.dumps(event))

    async def game_over(self, event):
        await self.send(text_data=json.dumps(event))

    # --- Online status ---

    @database_sync_to_async
    def set_online(self, is_online):
        key = f"user:{self.user.id}:online"
        if is_online:
            cache.set(key, 1, timeout=ONLINE_TTL)
        else:
            cache.delete(key)

    @staticmethod
    def is_online(user_id):
        return cache.get(f"user:{user_id}:online") is not None

    # --- Redis helpers ---

    @database_sync_to_async
    def cache_set(self, key: str, value, timeout: int):
        cache.set(key, value, timeout=timeout)

    @database_sync_to_async
    def cache_get(self, key: str):
        return cache.get(key)

    @database_sync_to_async
    def count_submitted(self, round_id: str) -> int:
        return len(cache.keys(f"round:{round_id}:drawing:*"))

    @database_sync_to_async
    def cancel_force_task(self, round_id: str):
        from celery.app.control import Control
        from config.celery import app as celery_app

        task_id = cache.get(f"round:{round_id}:task_id")
        if task_id:
            Control(celery_app).revoke(task_id, terminate=False)
            cache.delete(f"round:{round_id}:task_id")

    @database_sync_to_async
    def get_game_id_for_round(self, round_id: str):
        from game.models import Round

        try:
            return str(Round.objects.select_related("game").get(id=round_id).game.id)
        except Round.DoesNotExist:
            return None

    @database_sync_to_async
    def get_first_round(self, game):
        from game.models import Round

        return Round.objects.filter(game=game).order_by("number").first()

    # --- DB helpers ---

    @database_sync_to_async
    def get_server(self):
        from servers.services import ServerService

        try:
            return ServerService.get_server(self.room_code) if self.room_code else None
        except ValueError:
            return None

    @database_sync_to_async
    def is_player_in_server(self, server):
        return server.players.filter(id=self.user.id).exists()

    @database_sync_to_async
    def leave_server(self):
        from servers.services import ServerService

        ServerService.leave_server(self.room_code, self.user)

    @database_sync_to_async
    def start_game(self):
        from servers.services import ServerService

        return ServerService.start_game(self.room_code, self.user)

    @database_sync_to_async
    def get_players_count(self):
        from servers.services import ServerService

        server = ServerService.get_server(self.room_code)
        return server.players.count()
