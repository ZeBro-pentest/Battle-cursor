from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import (
    TokenObtainPairView as BaseTokenObtainPairView,
)

from .models import EmailVerification, User
from .serializers import (
    UserProfileSerializer,
    UserRegisterSerializer,
    UserUpdateSerializer,
)
from .services import EmailService, UserService

_REFRESH_COOKIE = "refresh"
_REFRESH_COOKIE_PATH = "/api/auth/"
_REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60


def _set_refresh_cookie(response, refresh_token: str) -> None:
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        samesite="None",
        secure=True,
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path=_REFRESH_COOKIE_PATH,
    )


def _delete_refresh_cookie(response) -> None:
    response.delete_cookie(_REFRESH_COOKIE, path=_REFRESH_COOKIE_PATH)


class LoginView(BaseTokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from rest_framework_simplejwt.tokens import AccessToken

            token = AccessToken(response.data["access"])
            user = User.objects.get(id=token["user_id"])

            if not user.is_verified and not user.is_superuser:
                EmailService.send_verification(user)
                return Response(
                    {"detail": "Подтвердите email. Письмо отправлено повторно."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            refresh_token = response.data.pop("refresh")
            _set_refresh_cookie(response, refresh_token)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(_REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {"detail": "Токен не найден."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Невалидный токен."}, status=status.HTTP_400_BAD_REQUEST
            )
        response = Response(status=status.HTTP_204_NO_CONTENT)
        _delete_refresh_cookie(response)
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(_REFRESH_COOKIE)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token не найден."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
        except Exception:
            return Response(
                {"detail": "Невалидный или истёкший токен."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"access": access})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.conf import settings

        email = request.data.get("email")
        username = request.data.get("username")

        # Если есть суперпользователь — ничего не удаляем
        if (email and User.objects.filter(email=email, is_superuser=True).exists()) or (
            username
            and User.objects.filter(username=username, is_superuser=True).exists()
        ):
            pass
        else:
            # Если DEBUG=True, удаляем любого (кроме суперюзера), чтобы тест прошел заново
            # Если DEBUG=False, удаляем только неподтвержденных
            if email:
                qs = User.objects.filter(email=email, is_superuser=False)
                if not settings.DEBUG:
                    qs = qs.filter(is_verified=False)
                qs.delete()
            if username:
                qs = User.objects.filter(username=username, is_superuser=False)
                if not settings.DEBUG:
                    qs = qs.filter(is_verified=False)
                qs.delete()

        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.register(serializer.validated_data, request)
        return Response(
            UserProfileSerializer(user).data, status=status.HTTP_201_CREATED
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Токен не указан."}, status=status.HTTP_400_BAD_REQUEST
            )
        success = UserService.verify_email(token)
        if not success:
            return Response(
                {"detail": "Токен недействителен или уже использован."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"detail": "Email успешно подтвержден. Теперь вы можете войти."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email не указан."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email, is_verified=False)
            EmailService.send_verification(user, request)
        except User.DoesNotExist:
            pass
        return Response({"detail": "Если аккаунт существует и не подтверждён — письмо отправлено."})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class ProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = UserService.update_profile(request.user, serializer.validated_data)
        return Response(UserProfileSerializer(user).data)


class ProfileDrawingView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        import cloudinary.uploader
        import cloudinary.api

        user = request.user

        if request.data.get("delete"):
            if user.profile_drawing:
                try:
                    cloudinary.api.delete_resources([f"profile_drawings/profile_{user.id}"])
                except Exception:
                    pass
            user.profile_drawing = None
            user.save(update_fields=["profile_drawing"])
            return Response({"image_url": None})

        image_base64 = request.data.get("image_base64")
        if not image_base64:
            return Response(
                {"detail": "image_base64 обязателен."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = cloudinary.uploader.upload(
                f"data:image/png;base64,{image_base64}",
                folder="profile_drawings",
                public_id=f"profile_{user.id}",
                overwrite=True,
                resource_type="image",
            )
            image_url = result.get("secure_url", "")
        except Exception as e:
            return Response(
                {"detail": f"Ошибка загрузки: {e}"}, status=status.HTTP_502_BAD_GATEWAY
            )

        user.profile_drawing = image_url
        user.save(update_fields=["profile_drawing"])
        return Response({"image_url": image_url})


# for tests


class GetVerificationTokenView(APIView):
    """
    Эндпоинт только для тестов. Возвращает токен верификации по email.
    Работает ТОЛЬКО если DEBUG=True.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings

        if not settings.DEBUG:
            return Response(status=status.HTTP_404_NOT_FOUND)

        email = request.query_params.get("email")
        if not email:
            return Response(
                {"detail": "Email не указан."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = UserService.get_verification_token(email)
            return Response({"token": token})
        except User.DoesNotExist:
            return Response(
                {"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND
            )
        except EmailVerification.DoesNotExist:
            return Response(
                {"detail": "Токен не найден."}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
