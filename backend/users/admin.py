from django import forms
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
        "is_active",
    )
    list_filter = ("is_verified", "is_active", "is_staff")
    search_fields = ("username", "email")
    readonly_fields = ("id", "email")
    fieldsets = (
        (None, {"fields": ("id", "username", "password")}),
        ("Personal info", {"fields": ("email",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        (
            "Battle-cursor Info",
            {"fields": ("is_verified", "rating", "coins", "cursor", "canvas")},
        ),
    )


class CursorAdminForm(forms.ModelForm):
    image = forms.CharField(help_text="Cloudinary Public ID, например: Stylus_cursor")

    class Meta:
        model = Cursor
        fields = "__all__"


class CanvasAdminForm(forms.ModelForm):
    image = forms.CharField(help_text="Cloudinary Public ID, например: Stylus_canvas")

    class Meta:
        model = Canvas
        fields = "__all__"


@admin.register(Cursor)
class CursorAdmin(admin.ModelAdmin):
    form = CursorAdminForm
    list_display = ("name", "price", "rarity", "id")
    search_fields = ("name",)


@admin.register(Canvas)
class CanvasAdmin(admin.ModelAdmin):
    form = CanvasAdminForm
    list_display = ("name", "price", "rarity", "id")
    search_fields = ("name",)


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "created_at", "is_used")
    list_filter = ("is_used",)
    readonly_fields = ("token", "created_at")
