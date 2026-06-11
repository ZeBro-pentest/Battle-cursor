from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GetVerificationTokenView,
    LoginView,
    LogoutView,
    ProfileDetailView,
    ProfileUpdateView,
    ProfileView,
    RegisterView,
    VerifyEmailView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    # Profile
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile_update"),
    path("profile/<uuid:user_id>/", ProfileDetailView.as_view(), name="profile_detail"),
    # Tests endpoints for postman and debugging
    path("auth/test-token/", GetVerificationTokenView.as_view(), name="get_test_token"),
]
