import uuid

from django.conf import settings
from django.db import models

from .validators import validate_max_players


class Server(models.Model):
    class StatusChoices(models.TextChoices):
        WAITING = "waiting", "Waiting"
        IN_PROGRESS = "in_progress", "In Progress"
        FINISHED = "finished", "Finished"

    room_code = models.CharField(max_length=8, unique=True, editable=False)
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_servers",
    )
    players = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="joined_servers",
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.WAITING,
    )
    max_players = models.PositiveSmallIntegerField(
        default=8,
        validators=[validate_max_players],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    game = models.OneToOneField(
        "game.Game",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="server",
    )

    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Server {self.room_code} ({self.status})"
