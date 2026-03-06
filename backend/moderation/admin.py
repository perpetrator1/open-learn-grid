from django.contrib import admin
from .models import Report, Ban, Appeal


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["id", "reported_item_type", "reason", "status", "reporter", "created_at"]
    list_filter = ["status", "reported_item_type", "reason"]
    search_fields = ["reporter__email", "description"]


@admin.register(Ban)
class BanAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "scope", "is_active", "banned_by", "created_at"]
    list_filter = ["scope", "is_active"]
    search_fields = ["user__email", "reason"]


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = ["id", "appellant", "status", "reviewed_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["appellant__email", "reason"]
