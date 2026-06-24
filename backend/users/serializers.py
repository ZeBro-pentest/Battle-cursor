from rest_framework import serializers

from users.validators import validate_password_strength

from .models import Canvas, Cursor, User


class CursorSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_orig_url = serializers.SerializerMethodField()

    class Meta:
        model = Cursor
        fields = ["id", "name", "image_url", "image_orig_url", "price", "debuffs", "rarity"]

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None

    def get_image_orig_url(self, obj):
        return obj.image_orig.url if obj.image_orig else None


class CanvasSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Canvas
        fields = ["id", "name", "image_url", "price", "protections", "rarity"]

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, min_length=8, validators=[validate_password_strength]
    )
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    coins = serializers.IntegerField(required=False)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "coins"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Пользователь с таким email уже существует."
            )
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Пароли не совпадают."}
            )
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    cursor = CursorSerializer(read_only=True)
    canvas = CanvasSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "rating",
            "coins",
            "cursor",
            "canvas",
            "is_verified",
        ]
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["cursor", "canvas"]

    def validate_cursor(self, value):
        user = self.context["request"].user
        if value and not user.inventory.cursors.filter(id=value.id).exists():
            raise serializers.ValidationError("Этот курсор не в вашем инвентаре.")
        return value

    def validate_canvas(self, value):
        user = self.context["request"].user
        if value and not user.inventory.canvases.filter(id=value.id).exists():
            raise serializers.ValidationError("Этот холст не в вашем инвентаре.")
        return value
