from rest_framework import serializers

from servers.models import Server


class PlayerBriefSerializer(serializers.Serializer):
    id = serializers.CharField()
    username = serializers.CharField()


class ServerListSerializer(serializers.ModelSerializer):
    host = serializers.StringRelatedField()
    players_count = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = [
            "room_code",
            "host",
            "players_count",
            "max_players",
            "status",
            "created_at",
        ]

    def get_players_count(self, obj):
        return obj.players.count()


class ServerDetailSerializer(serializers.ModelSerializer):
    host = serializers.StringRelatedField()
    players = PlayerBriefSerializer(many=True)
    players_count = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = [
            "room_code",
            "host",
            "players",
            "players_count",
            "max_players",
            "status",
            "created_at",
        ]

    def get_players_count(self, obj):
        return obj.players.count()


class ServerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Server
        fields = ["max_players"]
