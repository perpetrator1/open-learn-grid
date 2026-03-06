from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["id", "actor", "action", "target_type", "target_repr", "created_at"]
    list_filter = ["action", "target_type"]
    search_fields = ["actor__email", "target_repr"]
    readonly_fields = ["actor", "action", "target_type", "target_id", "target_repr",
                       "changes", "metadata", "created_at"]
