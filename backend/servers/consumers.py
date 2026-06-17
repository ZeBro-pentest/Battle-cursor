import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache

ONLINE_TTL = 20  # секунд


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
            await self.start_game()
        except ValueError as e:
            await self.send(text_data=json.dumps({"type": "error", "detail": str(e)}))
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "game_start",
                "room_code": self.room_code,
            },
        )

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

    # --- Online status ---

    @database_sync_to_async
    def set_online(self, is_online):
        key = f"user:{self.user.id}:online"
        print(f"SET ONLINE: {key} = {is_online}")
        if is_online:
            cache.set(key, 1, timeout=ONLINE_TTL)
        else:
            cache.delete(key)

    @staticmethod
    def is_online(user_id):
        return cache.get(f"user:{user_id}:online") is not None

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

        ServerService.start_game(self.room_code, self.user)
