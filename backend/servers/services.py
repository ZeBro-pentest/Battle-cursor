from servers.models import Server
from servers.repository import ServerRepository
from servers.validators import (
    validate_game_not_started,
    validate_room_not_full,
    validate_single_server,
    validate_single_session,
)


class ServerService:
    @staticmethod
    def create_server(host, max_players=8):
        validate_single_server(host)
        return ServerRepository.create_server(host=host, max_players=max_players)

    @staticmethod
    def get_server(room_code):
        server = ServerRepository.get_by_room_code(room_code)
        if not server:
            raise ValueError("Комната не найдена.")
        return server

    @staticmethod
    def join_server(room_code, user):
        server = ServerService.get_server(room_code)
        validate_game_not_started(server)
        validate_room_not_full(server)
        # Пропускаем если уже в этой комнате
        if not server.players.filter(id=user.id).exists():
            validate_single_session(user)
            ServerRepository.add_player(server, user)
        return server

    @staticmethod
    def leave_server(room_code, user):
        server = ServerService.get_server(room_code)
        ServerRepository.remove_player(server, user)
        # если вышел хост — удаляем комнату
        if server.host == user:
            server.delete()
            return None
        return server

    @staticmethod
    def get_waiting_servers():
        return ServerRepository.get_all_waiting()

    @staticmethod
    def start_game(room_code, user):
        from django.db import transaction
        from game.services import GameService, RoundService

        server = ServerService.get_server(room_code)
        if server.host != user:
            raise ValueError("Только хост может начать игру.")
        validate_game_not_started(server)

        players = list(server.players.all())
        if len(players) < 2:
            raise ValueError("Недостаточно игроков для начала игры.")

        # HTTP-запрос к Groq — до транзакции, чтобы не держать соединение открытым
        prompts = GameService._generate_prompts(len(players))

        with transaction.atomic():
            game = GameService.create(players=players, max_players=server.max_players)
            for i, prompt in enumerate(prompts, start=1):
                RoundService.create(game=game, number=i, prompt=prompt)
            server.game = game
            server.status = Server.StatusChoices.IN_PROGRESS
            server.save(update_fields=["game", "status"])

        return game
