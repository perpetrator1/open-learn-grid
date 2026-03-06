"""Serializers for the accounts app."""

import pyotp
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, RoleRequest, User, UserRole


# ---------------------------------------------------------------------------
# User serializers
# ---------------------------------------------------------------------------


class UserPublicSerializer(serializers.ModelSerializer):
    """Minimal public-facing user representation."""

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "avatar", "instance_origin"]
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    """Full profile for the authenticated user."""

    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "display_name",
            "avatar",
            "bio",
            "instance_origin",
            "is_verified_email",
            "is_2fa_enabled",
            "date_joined",
            "last_login",
            "permissions",
        ]
        read_only_fields = [
            "id",
            "email",
            "is_verified_email",
            "is_2fa_enabled",
            "date_joined",
            "last_login",
            "permissions",
        ]

    def get_permissions(self, obj):
        """Collect all permissions from the user's roles."""
        perms = set()
        for user_role in obj.user_roles.select_related("role").all():
            perms.update(user_role.role.permissions)
        return sorted(perms)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows updating mutable profile fields."""

    class Meta:
        model = User
        fields = ["username", "display_name", "avatar", "bio"]

    def validate_username(self, value):
        request = self.context.get("request")
        if (
            User.objects.filter(username=value)
            .exclude(pk=request.user.pk)
            .exists()
        ):
            raise serializers.ValidationError("This username is already taken.")
        return value


# ---------------------------------------------------------------------------
# Auth serializers
# ---------------------------------------------------------------------------


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "password_confirm", "display_name"]

    def validate(self, data):
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    totp_code = serializers.CharField(required=False, write_only=True, max_length=6)

    def validate(self, data):
        user = authenticate(
            request=self.context.get("request"),
            username=data["email"],
            password=data["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")

        # Check 2FA if enabled
        if user.is_2fa_enabled:
            totp_code = data.get("totp_code")
            if not totp_code:
                raise serializers.ValidationError(
                    {"totp_code": "2FA code required."}
                )
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(totp_code, valid_window=1):
                raise serializers.ValidationError({"totp_code": "Invalid 2FA code."})

        data["user"] = user
        return data


class TokenPairSerializer(serializers.Serializer):
    """Return access + refresh tokens for a user."""

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    @classmethod
    def for_user(cls, user):
        refresh = RefreshToken.for_user(user)
        return {"access": str(refresh.access_token), "refresh": str(refresh)}


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data.pop("new_password_confirm"):
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return data

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data.pop("new_password_confirm"):
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return data


# ---------------------------------------------------------------------------
# 2FA serializers
# ---------------------------------------------------------------------------


class TOTPSetupSerializer(serializers.Serializer):
    """Returns the TOTP provisioning URI for QR code generation."""

    totp_uri = serializers.CharField(read_only=True)
    secret = serializers.CharField(read_only=True)


class TOTPVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)


class TOTPDisableSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    code = serializers.CharField(max_length=6)


# ---------------------------------------------------------------------------
# Role serializers
# ---------------------------------------------------------------------------


class RoleSerializer(serializers.ModelSerializer):
    created_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "description",
            "is_system_role",
            "permissions",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_system_role", "created_by", "created_at", "updated_at"]


class RoleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["name", "description", "permissions"]

    def validate_name(self, value):
        qs = Role.objects.filter(name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A role with this name already exists.")
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    role = RoleSerializer(read_only=True)
    assigned_by = UserPublicSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source="role", write_only=True
    )

    class Meta:
        model = UserRole
        fields = [
            "id",
            "user",
            "role",
            "assigned_by",
            "assigned_at",
            "scope",
            "department",
            "user_id",
            "role_id",
        ]
        read_only_fields = ["id", "assigned_by", "assigned_at"]


class RoleRequestSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    requested_role = RoleSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True)
    requested_role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source="requested_role", write_only=True
    )

    class Meta:
        model = RoleRequest
        fields = [
            "id",
            "user",
            "requested_role",
            "requested_role_id",
            "status",
            "justification",
            "reviewed_by",
            "review_note",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "reviewed_by",
            "review_note",
            "created_at",
            "reviewed_at",
        ]


class RoleRequestReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["approved", "rejected"])
    review_note = serializers.CharField(allow_blank=True, default="")
