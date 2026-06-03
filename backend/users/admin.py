from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Canvas, Cursor, EmailVerification, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "is_verified",
        "rating",
        "coins",
        "wins",
        "is_active",
    )
    list_filter = ("is_verified", "is_active", "is_staff")
    search_fields = ("username", "email")
    readonly_fields = ("id", "email")
    fieldsets = UserAdmin.fieldsets + (
        (
            "Battle-cursor",
            {"fields": ("is_verified", "rating", "coins", "wins", "cursor", "canvas")},
        ),
    )


@admin.register(Cursor)
class CursorAdmin(admin.ModelAdmin):
    list_display = ("name", "price")
    search_fields = ("name",)


@admin.register(Canvas)
class CanvasAdmin(admin.ModelAdmin):
    list_display = ("name", "price")
    search_fields = ("name",)


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "created_at", "is_used")
    list_filter = ("is_used",)
    readonly_fields = ("token", "created_at")
