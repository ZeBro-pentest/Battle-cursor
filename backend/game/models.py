import uuid

from django.conf import settings
from django.db import models


def generate_game_number():
    import random
    import string

    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    number = models.CharField(
        max_length=6, unique=True, default=generate_game_number, editable=False
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_games"
    )
    players = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="joined_games", blank=True
    )
    max_players = models.PositiveIntegerField(default=8)
    started = models.BooleanField(default=False)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "games"

    def __str__(self):
        return f"Game {self.number}"


class Round(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="rounds")
    number = models.PositiveIntegerField()
    prompt = models.CharField(max_length=255)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_finished = models.BooleanField(default=False)

    class Meta:
        db_table = "rounds"
        ordering = ["number"]

    def __str__(self):
        return f"Round {self.number} — {self.game.number}"


class Score(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scores"
    )
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name="scores")
    value = models.PositiveIntegerField(default=0)
    comment = models.TextField(blank=True)
    coins_earned = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "scores"
        unique_together = ("user", "round")

    def __str__(self):
        return f"{self.user.username} — Round {self.round.number}: {self.value}"
