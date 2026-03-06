"""URL patterns for the accounts app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"roles/definitions", views.RoleViewSet, basename="role")
router.register(r"roles/assignments", views.UserRoleViewSet, basename="user-role")
router.register(r"roles/requests", views.RoleRequestViewSet, basename="role-request")

auth_patterns = [
    # Registration & email verification
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("verify-email/<str:token>/", views.VerifyEmailView.as_view(), name="auth-verify-email"),
    path("resend-verification/", views.ResendVerificationView.as_view(), name="auth-resend-verification"),

    # Login / Logout / Refresh
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("refresh/", views.TokenRefreshView.as_view(), name="auth-refresh"),

    # Profile
    path("profile/", views.ProfileView.as_view(), name="auth-profile"),

    # Password management
    path("password/change/", views.PasswordChangeView.as_view(), name="auth-password-change"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("password/reset/confirm/", views.PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),

    # 2FA
    path("2fa/setup/", views.TOTPSetupView.as_view(), name="auth-2fa-setup"),
    path("2fa/disable/", views.TOTPDisableView.as_view(), name="auth-2fa-disable"),
]

urlpatterns = [
    path("auth/", include(auth_patterns)),
    path("", include(router.urls)),
]
