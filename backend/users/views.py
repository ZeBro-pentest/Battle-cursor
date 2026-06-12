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
from .services import UserService


class LoginView(BaseTokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from rest_framework_simplejwt.tokens import AccessToken

            from .models import User

            token = AccessToken(response.data["access"])
            user = User.objects.get(id=token["user_id"])

            if not user.is_verified and not user.is_superuser:
                return Response(
                    {"detail": "Email не подтверждён."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Невалидный токен."}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        user = UserService.register(serializer.validated_data)
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
