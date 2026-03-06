from django.contrib import admin
from .models import Material, MaterialRequest, MaterialType, MaterialVersion, Tag


@admin.register(MaterialType)
class MaterialTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "is_active"]
    list_filter = ["is_active"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = [
        "title", "material_type", "subject", "uploaded_by",
        "verification_status", "is_archived", "created_at",
    ]
    list_filter = ["verification_status", "is_archived", "material_type"]
    search_fields = ["title", "description"]
    readonly_fields = ["view_count", "download_count", "created_at", "updated_at", "verified_at"]


@admin.register(MaterialVersion)
class MaterialVersionAdmin(admin.ModelAdmin):
    list_display = ["material", "version_number", "uploaded_by", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(MaterialRequest)
class MaterialRequestAdmin(admin.ModelAdmin):
    list_display = ["request_type", "requester", "status", "created_at"]
    list_filter = ["status", "request_type"]
    readonly_fields = ["created_at", "reviewed_at"]
