from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Role, RoleRequest, User, UserRole


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "username", "display_name", "is_verified_email", "is_2fa_enabled", "is_staff", "date_joined"]
    list_filter = ["is_staff", "is_superuser", "is_active", "is_verified_email", "is_2fa_enabled"]
    search_fields = ["email", "username", "display_name"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("username", "display_name", "avatar", "bio", "instance_origin")}),
        ("Status", {"fields": ("is_active", "is_staff", "is_superuser", "is_verified_email", "is_2fa_enabled")}),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2"),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["name", "is_system_role", "created_by", "created_at"]
    list_filter = ["is_system_role"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "scope", "department", "assigned_by", "assigned_at"]
    list_filter = ["scope", "role"]
    search_fields = ["user__email", "role__name"]
    readonly_fields = ["assigned_at"]


@admin.register(RoleRequest)
class RoleRequestAdmin(admin.ModelAdmin):
    list_display = ["user", "requested_role", "status", "reviewed_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["user__email", "requested_role__name"]
    readonly_fields = ["created_at", "reviewed_at"]
