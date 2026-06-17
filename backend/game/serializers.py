from rest_framework import serializers
from users.serializers import UserProfileSerializer

from game.models import Game, Round, Score


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
    players = UserProfileSerializer(many=True, read_only=True)
    players_count = serializers.SerializerMethodField()
    current_round = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "id",
            "number",
            "players",
            "players_count",
            "max_players",
            "started",
            "done",
            "created_at",
            "current_round",
        ]
        read_only_fields = fields

    def get_players_count(self, obj):
        return obj.players.count()

    def get_current_round(self, obj):
        round_obj = obj.rounds.filter(is_finished=False).first()
        return RoundSerializer(round_obj).data if round_obj else None
