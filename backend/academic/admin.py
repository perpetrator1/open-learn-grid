from django.contrib import admin
from .models import AcademicRequest, Course, Department, Semester, Subject, SubjectMapping


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["code", "name"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "department", "duration_years", "is_active"]
    list_filter = ["is_active", "department"]
    search_fields = ["code", "name"]


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ["course", "number", "academic_year", "is_active"]
    list_filter = ["is_active", "course"]


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "is_common", "credit_hours", "is_active"]
    list_filter = ["is_active", "is_common"]
    search_fields = ["code", "name"]


@admin.register(SubjectMapping)
class SubjectMappingAdmin(admin.ModelAdmin):
    list_display = ["subject", "semester", "department", "is_active"]
    list_filter = ["is_active"]


@admin.register(AcademicRequest)
class AcademicRequestAdmin(admin.ModelAdmin):
    list_display = ["request_type", "requester", "status", "created_at"]
    list_filter = ["status", "request_type"]
    readonly_fields = ["created_at", "reviewed_at"]
