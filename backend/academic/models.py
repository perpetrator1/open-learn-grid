"""
Models for the academic app.

Handles departments, courses, subjects, semesters, and academic structure requests.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User


class Department(models.Model):
    """Academic department or faculty."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="department-logos/", null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="departments_created",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["name"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Course(models.Model):
    """An academic programme/degree offered by a department (e.g. B.Tech CS)."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="courses"
    )
    duration_years = models.PositiveSmallIntegerField(default=4)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses_created",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["department", "name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["department"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Semester(models.Model):
    """A semester in a course (e.g. Semester 1 of B.Tech CS, 2024-25)."""

    number = models.PositiveSmallIntegerField()
    academic_year = models.CharField(max_length=20)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="semesters"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["course", "number"]
        unique_together = ("number", "academic_year", "course")
        indexes = [
            models.Index(fields=["course"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.course.code} Sem {self.number} ({self.academic_year})"


class Subject(models.Model):
    """A subject taught across courses/departments."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_common = models.BooleanField(default=False)
    credit_hours = models.PositiveSmallIntegerField(default=3)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subjects_created",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_common"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class SubjectMapping(models.Model):
    """Maps a subject to a semester+department combination."""

    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="mappings"
    )
    semester = models.ForeignKey(
        Semester, on_delete=models.CASCADE, related_name="subject_mappings"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subject_mappings",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("subject", "semester", "department")
        indexes = [
            models.Index(fields=["subject", "semester"]),
            models.Index(fields=["department"]),
        ]

    def __str__(self):
        dept = self.department.code if self.department_id else "default"
        return f"{self.subject.code} -> {self.semester} [{dept}]"


class AcademicRequest(models.Model):
    """User request to add new academic structures."""

    class RequestType(models.TextChoices):
        ADD_DEPARTMENT = "add_department", _("Add Department")
        ADD_COURSE = "add_course", _("Add Course")
        ADD_SUBJECT = "add_subject", _("Add Subject")
        ADD_SEMESTER = "add_semester", _("Add Semester")

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")

    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="academic_requests"
    )
    request_type = models.CharField(max_length=30, choices=RequestType.choices)
    payload = models.JSONField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_academic_requests",
    )
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["request_type"]),
            models.Index(fields=["requester"]),
        ]

    def __str__(self):
        return f"{self.get_request_type_display()} by {self.requester} [{self.status}]"
