from rest_framework import serializers
from users.serializers import UserProfileSerializer

from .models import Game, Round, Score


class ScoreSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = Score
        fields = ["id", "user", "value", "comment", "coins_earned"]
        read_only_fields = fields


class RoundSerializer(serializers.ModelSerializer):
    scores = ScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Round
        fields = [
            "id",
            "number",
            "prompt",
            "started_at",
            "ended_at",
            "is_finished",
            "scores",
        ]
        read_only_fields = fields


class GameSerializer(serializers.ModelSerializer):
    owner = UserProfileSerializer(read_only=True)
    players = UserProfileSerializer(many=True, read_only=True)
    players_count = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "id",
            "number",
            "owner",
            "players",
            "players_count",
            "max_players",
            "started",
            "done",
            "created_at",
        ]
        read_only_fields = fields

    def get_players_count(self, obj):
        return obj.players.count()


class GameCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ["max_players"]

    def validate_max_players(self, value):
        if value < 2:
            raise serializers.ValidationError("Минимум 2 игрока.")
        if value > 8:
            raise serializers.ValidationError("Максимум 8 игроков.")
        return value
