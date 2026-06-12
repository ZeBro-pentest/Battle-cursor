from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from market.models import Inventory

from .config import DEFAULT_FROM_EMAIL, FRONTEND_URL
from .models import EmailVerification, User


class UserService:
    @staticmethod
    def register(validated_data: dict) -> User:
        """
        Создаёт пользователя, инвентарь и отправляет письмо верификации.
        """
        from django.conf import settings

        coins = validated_data.get("coins", 10)
        if not settings.DEBUG:
            coins = 10

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            coins=coins,
        )
        Inventory.objects.create(user=user)
        EmailService.send_verification(user)
        return user

    @staticmethod
    def verify_email(token: str) -> bool:
        """
        Верифицирует email по токену.
        Возвращает True если успешно, False если токен невалиден.
        """
        import uuid
        try:
            # Проверяем, что токен - это валидный UUID
            uuid.UUID(str(token))
            verification = EmailVerification.objects.get(token=token, is_used=False)
        except (EmailVerification.DoesNotExist, ValueError, TypeError):
            return False

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        verification.user.is_verified = True
        verification.user.save(update_fields=["is_verified"])

        EmailService.send_welcome(verification.user)
        return True

    @staticmethod
    def update_profile(user: User, validated_data: dict) -> User:
        """
        Обновляет cursor и canvas пользователя.
        """
        for field, value in validated_data.items():
            setattr(user, field, value)
        user.save(update_fields=list(validated_data.keys()))
        return user

    @staticmethod
    def get_verification_token(email: str) -> str:
        """
        Возвращает последний неиспользованный токен верификации для email.
        Используется только для тестов.
        """
        try:
            user = User.objects.get(email=email)
            verification = EmailVerification.objects.filter(user=user, is_used=False).latest("created_at")
            return str(verification.token)
        except Exception as e:
            print(f"DEBUG TOKEN ERROR: {str(e)}") # Это появится в терминале Django
            raise e


class EmailService:
    @staticmethod
    def send_verification(user: User) -> None:
        """
        Отправляет письмо с ссылкой верификации через Mailtrap.
        """
        verification = EmailVerification.objects.create(user=user)
        verify_url = f"{FRONTEND_URL}/verify-email?token={verification.token}"
        
        context = {
            "username": user.username,
            "verify_url": verify_url,
        }
        html_message = render_to_string("emails/verification.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject="Подтвердите email — Battle Cursor",
            message=plain_message,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    @staticmethod
    def send_welcome(user: User) -> None:
        """
        Отправляет приветственное письмо после верификации.
        """
        context = {
            "username": user.username,
            "login_url": f"{FRONTEND_URL}/login",
        }
        html_message = render_to_string("emails/welcome.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject="Добро пожаловать в Battle Cursor!",
            message=plain_message,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
