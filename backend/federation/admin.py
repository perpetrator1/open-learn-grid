from django.contrib import admin
from .models import FederatedActivity, FederatedMaterial, Instance, InstanceBlock


@admin.register(Instance)
class InstanceAdmin(admin.ModelAdmin):
    list_display = ("domain", "name", "trust_level", "is_home", "is_reachable", "material_count", "user_count", "added_at")
    list_filter = ("trust_level", "is_home", "is_reachable", "is_active")
    search_fields = ("domain", "name", "admin_email")
    readonly_fields = ("added_at", "last_seen_at", "keypair_created_at")


@admin.register(FederatedActivity)
class FederatedActivityAdmin(admin.ModelAdmin):
    list_display = ("activity_type", "from_instance", "status", "retry_count", "created_at")
    list_filter = ("activity_type", "status")
    search_fields = ("activity_id", "from_instance__domain")
    readonly_fields = ("created_at", "processed_at")


@admin.register(FederatedMaterial)
class FederatedMaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "source_instance", "material_type", "verification_status", "is_removed", "synced_at")
    list_filter = ("material_type", "verification_status", "is_removed")
    search_fields = ("title", "uploaded_by_username", "subject_name")


@admin.register(InstanceBlock)
class InstanceBlockAdmin(admin.ModelAdmin):
    list_display = ("instance", "blocked_by", "block_type", "created_at")
    list_filter = ("block_type",)
