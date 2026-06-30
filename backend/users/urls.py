from django.urls import path

from .views import (
    CookieTokenRefreshView,
    GetVerificationTokenView,
    LoginView,
    LogoutView,
    ProfileDetailView,
    ProfileDrawingView,
    ProfileUpdateView,
    ProfileView,
    RegisterView,
    ResendVerificationView,
    VerifyEmailView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/login/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("auth/resend-verification/", ResendVerificationView.as_view(), name="resend_verification"),
    # Profile
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile_update"),
    path("profile/drawing/", ProfileDrawingView.as_view(), name="profile_drawing"),
    path("profile/<uuid:user_id>/", ProfileDetailView.as_view(), name="profile_detail"),
    # Tests endpoints for postman and debugging
    path("auth/test-token/", GetVerificationTokenView.as_view(), name="get_test_token"),
]
