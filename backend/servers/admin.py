from django.contrib import admin

from servers.models import Server


@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = [
        "room_code",
        "host",
        "status",
        "players_count",
        "max_players",
        "created_at",
    ]
    list_filter = ["status"]
    readonly_fields = ["room_code", "created_at"]

    def players_count(self, obj):
        return obj.players.count()

    players_count.short_description = "Игроков"
