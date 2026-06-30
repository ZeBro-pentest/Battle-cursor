from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from servers.serializers import (
    ServerCreateSerializer,
    ServerDetailSerializer,
    ServerListSerializer,
)
from servers.services import ServerService


class ServerCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        servers = ServerService.get_waiting_servers()
        serializer = ServerListSerializer(servers, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ServerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            server = ServerService.create_server(
                host=request.user,
                max_players=serializer.validated_data.get("max_players", 8),
            )
        except ValidationError as e:
            msg = e.messages[0] if e.messages else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            ServerDetailSerializer(server).data, status=status.HTTP_201_CREATED
        )


class ServerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_code):
        try:
            server = ServerService.get_server(room_code)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServerDetailSerializer(server)
        return Response(serializer.data)


class ServerJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_code):
        try:
            server = ServerService.join_server(room_code=room_code, user=request.user)
        except ValidationError as e:
            msg = e.messages[0] if e.messages else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ServerDetailSerializer(server).data)


class ServerDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, room_code):
        try:
            server = ServerService.get_server(room_code)
        except ValueError:
            return Response({"detail": "Комната не найдена."}, status=status.HTTP_404_NOT_FOUND)
        if server.host != request.user:
            return Response({"detail": "Только хост может удалить комнату."}, status=status.HTTP_403_FORBIDDEN)
        server.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServerLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_code):
        try:
            ServerService.leave_server(room_code=room_code, user=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Вы покинули комнату."})
