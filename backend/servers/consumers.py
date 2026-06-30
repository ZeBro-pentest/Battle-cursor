import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache

logger = logging.getLogger(__name__)

ONLINE_TTL = 20  # секунд
DRAWING_TTL = 300  # 5 минут


class GameConsumer(AsyncWebsocketConsumer):
    game_id: str | None = None  # устанавливается при получении game_over

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

        logger.info(
            "WS connect: user=%s (%s) room=%s channel=%s",
            self.user.id, self.user.username, self.room_code, self.channel_name,
        )

        # Host reconnected within grace period → cancel pending server deletion
        if server.host_id == self.user.id:
            cache.delete(f"server:{self.room_code}:host_disconnected")

        # Cancel pending kick if player reconnected during game
        if server.game_id:
            cache.delete(f"game:{str(server.game_id)}:offline:{str(self.user.id)}")

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "player_joined",
                "user_id": str(self.user.id),
                "username": self.user.username,
            },
        )

        game_state = await self.get_current_game_state()
        if game_state:
            await self.send(text_data=json.dumps({
                "type": "game_state_sync",
                **game_state,
            }))

    async def disconnect(self, close_code):
        if (
            hasattr(self, "room_group")
            and hasattr(self, "user")
            and self.user.is_authenticated
        ):
            await self.set_online(False)

            server = await self.get_server()
            if server and server.status == server.StatusChoices.WAITING:
                if server.host_id == self.user.id:
                    # Grace period: wait 10s before deleting server
                    cache.set(
                        f"server:{self.room_code}:host_disconnected", 1, timeout=30
                    )
                    from servers.tasks import delete_server_if_host_absent

                    delete_server_if_host_absent.apply_async(
                        args=[self.room_code, self.room_group], countdown=10
                    )
                else:
                    await self.leave_server()
                    server = await self.get_server()
            elif server and server.status == server.StatusChoices.IN_PROGRESS and server.game_id:
                # Game in progress — schedule kick after 30s if player doesn't reconnect
                user_id_str = str(self.user.id)
                game_id_str = str(server.game_id)
                cache.set(f"game:{game_id_str}:offline:{user_id_str}", 1, timeout=35)
                from ai.tasks import kick_offline_player
                kick_offline_player.apply_async(
                    args=[game_id_str, self.room_group, user_id_str, self.room_code],
                    countdown=30,
                )

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

            # После завершённой игры запускаем cleanup (идемпотентный)
            if self.game_id:
                from ai.tasks import cleanup_game
                cleanup_game.delay(self.game_id, self.room_code)

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
            "debuff_apply": self.handle_debuff_apply,
            "debuff_solved": self.handle_debuff_solved,
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

        # Сохраняем players_count в Redis один раз для всей игры
        players_count = await self.get_players_count()
        cache.set(f"game:{game.id}:players_count", players_count, timeout=3600)

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
        Игрок сдаёт рисунок по окончании раунда.
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
        cache.set(
            f"round:{round_id}:drawing:{self.user.id}",
            {"image_base64": image_base64, "image_url": image_url},
            timeout=DRAWING_TTL,
        )
        logger.info(
            "Drawing saved: round=%s user=%s base64_len=%d",
            round_id, self.user.id, len(image_base64),
        )

        # Проверяем что сохранилось
        saved = cache.get(f"round:{round_id}:drawing:{self.user.id}")
        logger.info("Verify saved: %s", "OK" if saved else "FAILED")

        # Атомарно считаем сколько игроков сдали
        counter_key = f"round:{round_id}:submitted"
        cache.add(counter_key, 0, timeout=DRAWING_TTL)
        submitted = cache.incr(counter_key)

        # Берём players_count
        game_id = await self.get_game_id_for_round(round_id)
        players_count = cache.get(f"game:{game_id}:players_count")

        logger.info(
            "round_end: round=%s user=%s submitted=%d/%s",
            round_id,
            self.user.id,
            submitted,
            players_count,
        )

        if players_count and submitted >= players_count:
            await self.cancel_force_task(round_id)
            from ai.tasks import grade_round

            grade_round.delay(round_id, self.room_group)
            logger.info("All submitted for round %s, grade_round triggered", round_id)

    async def handle_debuff_apply(self, data):
        """
        Игрок применяет дебафф к цели. Одноразовое применение без монет.
        Ожидает: {"type": "debuff_apply", "debuff_id": "...", "target_id": "..."}
        """
        from game.debuffs import DEBUFFS

        debuff_id = data.get("debuff_id")
        target_id = data.get("target_id")

        if not debuff_id or not target_id:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "Отсутствуют debuff_id или target_id."}
                )
            )
            return

        logger.info(
            "handle_debuff_apply: self.user=%s (%s), data=%s",
            self.user.id, self.user.username, data,
        )
        logger.info(
            "debuff_apply: sender=%s target=%s debuff=%s same_player=%s",
            self.user.id, target_id, debuff_id, target_id == str(self.user.id),
        )

        if target_id == str(self.user.id):
            await self.send(
                text_data=json.dumps({
                    "type": "error",
                    "detail": "Нельзя применить дебафф на себя.",
                })
            )
            return

        # Проверяем что дебафф существует
        debuff = next((d for d in DEBUFFS if d["id"] == debuff_id), None)
        if not debuff:
            await self.send(
                text_data=json.dumps({"type": "error", "detail": "Дебафф не найден."})
            )
            return

        # Получаем game_id
        game_id = await self.get_game_id_from_server()
        if not game_id:
            await self.send(
                text_data=json.dumps({"type": "error", "detail": "Игра не найдена."})
            )
            return

        game_id = str(game_id)
        current_round_id = await self.get_current_round_id(game_id)
        logger.info(
            "handle_debuff_apply: game_id=%s current_round_id=%s debuff=%s",
            game_id, current_round_id, debuff_id,
        )

        # Проверяем что игрок не использовал этот дебафф в текущем раунде
        used_key = f"game:{game_id}:used_debuff:{self.user.id}:{debuff_id}"
        if cache.get(used_key):
            await self.send(
                text_data=json.dumps({
                    "type": "error",
                    "detail": "Этот дебафф уже использован в этом раунде.",
                })
            )
            return

        LEGENDARY_DEBUFFS = {
            "questions", "exam", "weighting", "weapons", "rickroll",
            "disco", "transparency", "brightness", "roulette", "dvd",
        }

        # Проверяем активный дебафф у цели
        if cache.get(f"game:{game_id}:debuff_active:{target_id}"):
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "У цели уже активен дебафф."}
                )
            )
            return

        # Проверяем что курсор атакующего имеет этот дебафф
        has_debuff = await self.user_has_debuff(debuff_id)
        if not has_debuff:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "detail": "Ваш курсор не имеет этого дебаффа."}
                )
            )
            return

        # Mirror: если у цели есть дебафф mirror в курсоре — отражаем обратно
        if not data.get("is_reflected"):
            target_has_mirror = await self.target_has_debuff(target_id, "mirror")
            if target_has_mirror:
                duration_val = debuff.get("duration", 5)
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "debuff_received",
                        "target_id": str(self.user.id),
                        "debuff_id": debuff_id,
                        "duration": duration_val,
                        "from_user_id": target_id,
                        "reflected": True,
                        "round_id": current_round_id,
                    },
                )
                await self.send(
                    text_data=json.dumps({
                        "type": "debuff_reflected",
                        "detail": "Дебафф отражён! Защита Mirror сработала.",
                        "debuff_id": debuff_id,
                    })
                )
                return

        duration = debuff.get("duration", 5)
        target_protections = await self.get_target_protections(target_id)
        if debuff_id in target_protections:
            protection_used_key = (
                f"game:{game_id}:protection_used:{target_id}:{debuff_id}"
            )
            if not cache.get(protection_used_key):
                # Защита срабатывает первый раз — помечаем как использованную
                cache.set(protection_used_key, 1, timeout=70)
                await self.send(
                    text_data=json.dumps({
                        "type": "debuff_protected",
                        "detail": "Защита холста сработала! Дебафф заблокирован.",
                        "debuff_id": debuff_id,
                        "target_id": target_id,
                    })
                )
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        "type": "debuff_blocked",
                        "target_id": target_id,
                        "debuff_id": debuff_id,
                        "from_user_id": str(self.user.id),
                    },
                )
                return
            # Защита уже использована — дебафф проходит как обычно

        # Ставим блокировку цели
        # LEGENDARY — блокируют на 5 сек (эффект на весь раунд, но цель снова доступна быстро)
        # Обычные — блокируют на duration сек
        if debuff_id in LEGENDARY_DEBUFFS:
            cache.set(
                f"game:{game_id}:debuff_active:{target_id}", debuff_id, timeout=5
            )
        elif duration:
            cache.set(
                f"game:{game_id}:debuff_active:{target_id}", debuff_id, timeout=duration
            )

        # Помечаем дебафф как использованный в этом раунде
        cache.set(used_key, 1, timeout=70)

        # Пушим debuff_received — фильтрация по target_id в group event handler
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "debuff_received",
                "target_id": target_id,
                "debuff_id": debuff_id,
                "duration": duration,
                "from_user_id": str(self.user.id),
                "round_id": current_round_id,
            },
        )

        logger.info(
            "debuff_apply: user=%s → target=%s debuff=%s duration=%s",
            self.user.id,
            target_id,
            debuff_id,
            duration,
        )

    async def handle_debuff_solved(self, data):
        debuff_id = data.get("debuff_id")
        user_id = data.get("user_id")
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "debuff_solved",
                "debuff_id": debuff_id,
                "user_id": user_id,
            },
        )

    # --- Group event handlers ---

    async def player_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_left(self, event):
        await self.send(text_data=json.dumps(event))

    async def server_deleted(self, event):
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
        self.game_id = event.get("game_id")
        await self.send(text_data=json.dumps(event))

    async def debuff_received(self, event):
        await self.send(text_data=json.dumps(event))

    async def debuff_blocked(self, event):
        await self.send(text_data=json.dumps(event))

    async def debuff_solved(self, event):
        await self.send(text_data=json.dumps(event))

    # --- Game state sync ---

    async def get_current_game_state(self):
        from game.models import Game, Round
        from servers.models import Server
        try:
            server = await Server.objects.aget(room_code=self.room_code)
            if server.status != server.StatusChoices.IN_PROGRESS:
                return None
            game = await Game.objects.filter(server=server, done=False).afirst()
            if not game:
                return None
            current_round = await Round.objects.filter(
                game=game, is_finished=False
            ).afirst()
            if not current_round or not current_round.started_at:
                return None
            from django.utils import timezone
            elapsed = (timezone.now() - current_round.started_at).seconds
            remaining = max(1, 60 - elapsed)
            total_rounds = await game.rounds.acount()
            game_id_str = str(game.id)
            cursor_debuffs = await self.get_user_cursor_debuffs()
            used_debuffs = [
                d for d in cursor_debuffs
                if cache.get(f"game:{game_id_str}:used_debuff:{self.user.id}:{d}")
            ]
            from game.models import Score
            player_scores: dict[str, float] = {}
            async for score in Score.objects.filter(
                round__game=game
            ).select_related("user"):
                uid = str(score.user.id)
                player_scores[uid] = player_scores.get(uid, 0.0) + float(score.value)
            finished_rounds = []
            async for r in Round.objects.filter(
                game=game, is_finished=True
            ).order_by("number"):
                round_scores = []
                async for s in Score.objects.filter(round=r).select_related("user"):
                    round_scores.append({
                        "user_id": str(s.user.id),
                        "username": s.user.username,
                        "score": float(s.value),
                        "comment": s.comment,
                        "image_url": s.image_url or "",
                        "coins_earned": s.coins_earned,
                    })
                finished_rounds.append({
                    "round_number": r.number,
                    "prompt": r.prompt,
                    "scores": round_scores,
                })
            return {
                "game_id": game_id_str,
                "round_id": str(current_round.id),
                "round_number": current_round.number,
                "prompt": current_round.prompt,
                "time_left": remaining,
                "total_rounds": total_rounds,
                "used_debuffs": used_debuffs,
                "player_scores": player_scores,
                "round_history": finished_rounds,
            }
        except Exception:
            return None

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
    def cancel_force_task(self, round_id: str):
        from celery.app.control import Control
        from config.celery import app as celery_app

        task_id = cache.get(f"round:{round_id}:task_id")
        if task_id:
            Control(celery_app).revoke(task_id, terminate=False)
            cache.delete(f"round:{round_id}:task_id")

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

    @database_sync_to_async
    def get_first_round(self, game):
        from game.models import Round

        return Round.objects.filter(game=game).order_by("number").first()

    @database_sync_to_async
    def get_game_id_for_round(self, round_id: str):
        from game.models import Round

        try:
            return str(Round.objects.select_related("game").get(id=round_id).game.id)
        except Round.DoesNotExist:
            return None

    @database_sync_to_async
    def get_game_id_from_server(self):
        from servers.services import ServerService

        try:
            server = ServerService.get_server(self.room_code)
            return server.game.id if server and server.game else None
        except Exception:
            return None

    @database_sync_to_async
    def get_current_round_id(self, game_id: str):
        from game.models import Round

        try:
            round_obj = Round.objects.filter(
                game_id=game_id, is_finished=False
            ).order_by("number").first()
            logger.info(
                "get_current_round_id: game_id=%s → round_id=%s",
                game_id, round_obj.id if round_obj else None,
            )
            return str(round_obj.id) if round_obj else None
        except Exception:
            return None

    @database_sync_to_async
    def get_user_cursor_debuffs(self) -> list:
        """Возвращает список debuff_id из активного курсора игрока."""
        user = self.user.__class__.objects.select_related("cursor").get(id=self.user.id)
        if not user.cursor:
            return []
        return user.cursor.debuffs or []

    @database_sync_to_async
    def user_has_debuff(self, debuff_id: str) -> bool:
        """Проверяет что активный курсор игрока имеет данный дебафф."""
        user = self.user.__class__.objects.select_related("cursor").get(id=self.user.id)
        if not user.cursor:
            return False
        return debuff_id in (user.cursor.debuffs or [])

    @database_sync_to_async
    def target_has_debuff(self, target_id: str, debuff_id: str) -> bool:
        """Проверяет что курсор целевого игрока содержит указанный дебафф."""
        try:
            user = self.user.__class__.objects.select_related("cursor").get(id=target_id)
            if not user.cursor:
                return False
            return debuff_id in (user.cursor.debuffs or [])
        except Exception:
            return False

    @database_sync_to_async
    def get_target_protections(self, target_id: str) -> list:
        """Возвращает список защит канваса целевого игрока."""
        try:
            user = self.user.__class__.objects.select_related("canvas").get(
                id=target_id
            )
            if not user.canvas:
                return []
            return user.canvas.protections or []
        except Exception:
            return []
