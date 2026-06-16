from django.contrib import admin

from .models import Game, Round, Score


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("number", "max_players", "started", "done", "created_at")
    list_filter = ("started", "done")
    search_fields = ("number",)
    readonly_fields = ("id", "number", "created_at")


@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ("number", "game", "prompt", "is_finished", "started_at", "ended_at")
    list_filter = ("is_finished",)
    search_fields = ("game__number",)
    readonly_fields = ("id",)


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ("user", "round", "value", "coins_earned")
    search_fields = ("user__username",)
    readonly_fields = ("id",)
