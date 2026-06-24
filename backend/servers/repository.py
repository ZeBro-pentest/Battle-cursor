from servers.models import Server


class ServerRepository:
    @staticmethod
    def create_server(host, max_players=8):
        server = Server.objects.create(host=host, max_players=max_players)
        server.players.add(host)
        return server

    @staticmethod
    def get_by_room_code(room_code):
        return Server.objects.filter(room_code=room_code).first()

    @staticmethod
    def add_player(server, user):
        server.players.add(user)

    @staticmethod
    def remove_player(server, user):
        server.players.remove(user)

    @staticmethod
    def update_status(server, status):
        server.status = status
        server.save(update_fields=["status"])

    @staticmethod
    def get_all_waiting():
        return (
            Server.objects.filter(status=Server.StatusChoices.WAITING)
            .prefetch_related("players")
            .select_related("host")
        )
