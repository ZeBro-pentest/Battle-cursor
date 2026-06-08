import uuid

from cloudinary.models import CloudinaryField
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from .validators import (
    username_max_length,
    username_min_length,
    username_validator,
    validate_debuffs_list,
)


class Cursor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    image = CloudinaryField("cursor_image")
    price = models.PositiveIntegerField(default=0)
    debuffs = models.JSONField(default=list, validators=[validate_debuffs_list])

    class Meta:
        db_table = "cursors"

    def __str__(self):
        return self.name


class Canvas(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    image = CloudinaryField("canvas_image")
    price = models.PositiveIntegerField(default=0)
    protections = models.JSONField(default=list, validators=[validate_debuffs_list])

    class Meta:
        db_table = "canvases"

    def __str__(self):
        return self.name


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, editable=False)
    is_verified = models.BooleanField(default=False)
    rating = models.PositiveIntegerField(default=0)
    coins = models.PositiveIntegerField(default=10)
    cursor = models.ForeignKey(
        Cursor, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    canvas = models.ForeignKey(
        Canvas, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )

    username = models.CharField(
        max_length=24,
        unique=True,
        validators=[username_validator, username_min_length, username_max_length],
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_verified = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class EmailVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verifications",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "email_verifications"

    def __str__(self):
        return f"{self.user.username} — {self.token}"
