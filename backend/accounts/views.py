"""Views for the accounts app — auth, profile, 2FA, and role management."""

import io
import pyotp
import qrcode
import base64

from django.contrib.auth import update_session_auth_hash
from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, RoleRequest, User, UserRole
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    RoleRequestReviewSerializer,
    RoleRequestSerializer,
    RoleSerializer,
    RoleWriteSerializer,
    TOTPDisableSerializer,
    TOTPVerifySerializer,
    TokenPairSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserRoleSerializer,
)

VERIFY_EMAIL_SALT = "email-verification"
PASSWORD_RESET_SALT = "password-reset"
TOKEN_MAX_AGE = 3600  # 1 hour


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def _send_verification_email(user, request=None):
    token = signing.dumps(user.pk, salt=VERIFY_EMAIL_SALT)
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    link = f"{base_url}/verify-email/{token}"
    send_mail(
        subject="Verify your Open Learn Grid account",
        message=f"Click the link to verify your email:\n\n{link}",
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@openlearngrid.local"),
        recipient_list=[user.email],
        fail_silently=False,
    )


def _send_password_reset_email(user):
    token = signing.dumps(user.pk, salt=PASSWORD_RESET_SALT)
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    link = f"{base_url}/reset-password/{token}"
    send_mail(
        subject="Reset your Open Learn Grid password",
        message=f"Click the link to reset your password:\n\n{link}\n\nThis link expires in 1 hour.",
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@openlearngrid.local"),
        recipient_list=[user.email],
        fail_silently=False,
    )


# ---------------------------------------------------------------------------
# Registration & email verification
# ---------------------------------------------------------------------------


class RegisterView(APIView):
    """POST /api/auth/register/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            _send_verification_email(user, request)
        except Exception:
            pass  # Don't fail registration if email sending fails
        return Response(
            {"detail": "Account created. Please verify your email."},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """GET /api/auth/verify-email/<token>/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            user_pk = signing.loads(token, salt=VERIFY_EMAIL_SALT, max_age=TOKEN_MAX_AGE)
        except signing.SignatureExpired:
            return Response(
                {"detail": "Verification link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except signing.BadSignature:
            return Response(
                {"detail": "Invalid verification token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=user_pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.is_verified_email = True
        user.save(update_fields=["is_verified_email"])
        return Response({"detail": "Email verified successfully."})


class ResendVerificationView(APIView):
    """POST /api/auth/resend-verification/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_verified_email:
            return Response({"detail": "Email is already verified."})
        _send_verification_email(request.user, request)
        return Response({"detail": "Verification email sent."})


# ---------------------------------------------------------------------------
# Login / Logout / Token refresh
# ---------------------------------------------------------------------------


class LoginView(APIView):
    """POST /api/auth/login/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        tokens = TokenPairSerializer.for_user(user)
        profile = UserProfileSerializer(user, context={"request": request})
        return Response({**tokens, "user": profile.data})


class LogoutView(APIView):
    """POST /api/auth/logout/  — blacklists the refresh token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Token is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Logged out successfully."})


class TokenRefreshView(APIView):
    """POST /api/auth/refresh/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            return Response({"access": str(token.access_token)})
        except TokenError:
            return Response(
                {"detail": "Token is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Password management
# ---------------------------------------------------------------------------


class PasswordChangeView(APIView):
    """POST /api/auth/password/change/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        update_session_auth_hash(request, request.user)
        return Response({"detail": "Password changed successfully."})


class PasswordResetRequestView(APIView):
    """POST /api/auth/password/reset/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=serializer.validated_data["email"])
            _send_password_reset_email(user)
        except User.DoesNotExist:
            pass  # Silently ignore — don't leak account existence
        return Response(
            {"detail": "If an account with that email exists, a reset link has been sent."}
        )


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password/reset/confirm/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user_pk = signing.loads(
                serializer.validated_data["token"],
                salt=PASSWORD_RESET_SALT,
                max_age=TOKEN_MAX_AGE,
            )
        except signing.SignatureExpired:
            return Response(
                {"detail": "Reset link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except signing.BadSignature:
            return Response(
                {"detail": "Invalid reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=user_pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password reset successfully."})


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/"""

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserProfileUpdateSerializer
        return UserProfileSerializer


# ---------------------------------------------------------------------------
# 2FA (TOTP)
# ---------------------------------------------------------------------------


class TOTPSetupView(APIView):
    """
    GET  /api/auth/2fa/setup/   — Generate a new TOTP secret + QR code URI
    POST /api/auth/2fa/setup/   — Verify TOTP code and enable 2FA
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(
            name=request.user.email, issuer_name="Open Learn Grid"
        )
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        request.session["pending_totp_secret"] = secret
        return Response({"totp_uri": uri, "secret": secret, "qr_code": qr_b64})

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        secret = request.session.get("pending_totp_secret")
        if not secret:
            return Response(
                {"detail": "No pending 2FA setup. Please call GET first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        totp = pyotp.TOTP(secret)
        if not totp.verify(serializer.validated_data["code"], valid_window=1):
            return Response(
                {"detail": "Invalid code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        user.totp_secret = secret
        user.is_2fa_enabled = True
        user.save(update_fields=["totp_secret", "is_2fa_enabled"])
        del request.session["pending_totp_secret"]
        return Response({"detail": "2FA enabled successfully."})


class TOTPDisableView(APIView):
    """POST /api/auth/2fa/disable/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TOTPDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["password"]):
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(serializer.validated_data["code"], valid_window=1):
            return Response(
                {"detail": "Invalid 2FA code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.totp_secret = ""
        user.is_2fa_enabled = False
        user.save(update_fields=["totp_secret", "is_2fa_enabled"])
        return Response({"detail": "2FA disabled successfully."})


# ---------------------------------------------------------------------------
# Role management
# ---------------------------------------------------------------------------


def _user_has_perm(user, perm):
    if user.is_superuser:
        return True
    return user.user_roles.filter(role__permissions__contains=[perm]).exists()


class RoleViewSet(viewsets.ModelViewSet):
    """CRUD for roles. Requires users.manage_roles for write operations."""

    queryset = Role.objects.all().order_by("-is_system_role", "name")
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RoleWriteSerializer
        return RoleSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if not _user_has_perm(self.request.user, "users.manage_roles"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create roles.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        if not _user_has_perm(self.request.user, "users.manage_roles"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to edit roles.")
        instance = self.get_object()
        if instance.is_system_role:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("System roles cannot be modified.")
        serializer.save()

    def perform_destroy(self, instance):
        if not _user_has_perm(self.request.user, "users.manage_roles"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete roles.")
        if instance.is_system_role:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("System roles cannot be deleted.")
        instance.delete()


class UserRoleViewSet(viewsets.ModelViewSet):
    """Manage role assignments. Requires users.assign_roles."""

    queryset = UserRole.objects.select_related(
        "user", "role", "assigned_by", "department"
    ).all()
    serializer_class = UserRoleSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["user__email", "user__username", "role__name"]

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def _check_assign_perm(self):
        if not _user_has_perm(self.request.user, "users.assign_roles"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to assign roles.")

    def perform_create(self, serializer):
        self._check_assign_perm()
        serializer.save(assigned_by=self.request.user)

    def perform_destroy(self, instance):
        self._check_assign_perm()
        instance.delete()


class RoleRequestViewSet(viewsets.ModelViewSet):
    """Users create role requests; reviewers approve/reject."""

    filter_backends = [filters.SearchFilter]
    search_fields = ["user__email", "requested_role__name", "status"]

    def get_queryset(self):
        user = self.request.user
        if _user_has_perm(user, "users.review_role_requests"):
            return RoleRequest.objects.select_related(
                "user", "requested_role", "reviewed_by"
            ).all()
        return RoleRequest.objects.filter(user=user).select_related(
            "user", "requested_role", "reviewed_by"
        )

    def get_serializer_class(self):
        if self.action == "review":
            return RoleRequestReviewSerializer
        return RoleRequestSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        """POST /api/roles/requests/<id>/review/"""
        if not _user_has_perm(request.user, "users.review_role_requests"):
            return Response(
                {"detail": "You do not have permission to review role requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        role_request = self.get_object()
        if role_request.status != RoleRequest.Status.PENDING:
            return Response(
                {"detail": "This request has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = RoleRequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_request.status = serializer.validated_data["status"]
        role_request.review_note = serializer.validated_data.get("review_note", "")
        role_request.reviewed_by = request.user
        role_request.reviewed_at = timezone.now()
        role_request.save()
        if role_request.status == RoleRequest.Status.APPROVED:
            UserRole.objects.get_or_create(
                user=role_request.user,
                role=role_request.requested_role,
                department=None,
                defaults={"assigned_by": request.user},
            )
        return Response(RoleRequestSerializer(role_request).data)
