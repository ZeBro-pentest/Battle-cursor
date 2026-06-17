from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from servers.services import ServerService

from game.models import Score
from game.serializers import GameSerializer, RoundSerializer, ScoreSerializer


class GameDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        try:
            server = ServerService.get_server(room_code)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        if not server.game:
            return Response(
                {"detail": "Игра ещё не началась."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = GameSerializer(server.game)
        return Response(serializer.data)


class GameRoundsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        try:
            server = ServerService.get_server(room_code)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        if not server.game:
            return Response(
                {"detail": "Игра ещё не началась."}, status=status.HTTP_404_NOT_FOUND
            )

        rounds = server.game.rounds.all()
        serializer = RoundSerializer(rounds, many=True)
        return Response(serializer.data)


class GameScoresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        try:
            server = ServerService.get_server(room_code)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        if not server.game:
            return Response(
                {"detail": "Игра ещё не началась."}, status=status.HTTP_404_NOT_FOUND
            )

        scores = Score.objects.filter(round__game=server.game).select_related(
            "user", "round"
        )
        serializer = ScoreSerializer(scores, many=True)
        return Response(serializer.data)
