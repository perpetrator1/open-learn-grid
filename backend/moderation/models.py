"""Moderation app models: Report, Ban, Appeal."""
from django.db import models
from django.utils import timezone
from accounts.models import User


class Report(models.Model):
    class ItemType(models.TextChoices):
        MATERIAL = "material", "Material"
        USER = "user", "User"
        INSTANCE = "instance", "Instance"

    class Reason(models.TextChoices):
        INAPPROPRIATE = "inappropriate_content", "Inappropriate Content"
        COPYRIGHT = "copyright_violation", "Copyright Violation"
        SPAM = "spam", "Spam"
        HARASSMENT = "harassment", "Harassment"
        INCORRECT = "incorrect_info", "Incorrect Information"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        UNDER_REVIEW = "under_review", "Under Review"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    reporter = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="submitted_reports"
    )
    reported_item_type = models.CharField(max_length=20, choices=ItemType.choices)
    material = models.ForeignKey(
        "materials.Material", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reports",
    )
    reported_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reports_against",
    )
    reason = models.CharField(max_length=30, choices=Reason.choices)
    description = models.TextField()
    evidence_urls = models.JSONField(default=list, blank=True)
    context = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_reports",
    )
    action_taken = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="resolved_reports",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["reported_item_type"]),
        ]

    def __str__(self):
        return f"Report #{self.pk} – {self.get_reason_display()} ({self.status})"


class Ban(models.Model):
    class Scope(models.TextChoices):
        INSTANCE_WIDE = "instance_wide", "Instance-wide"
        DEPARTMENT_LEVEL = "department_level", "Department-level"
        SUBJECT_LEVEL = "subject_level", "Subject-level"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bans")
    banned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="bans_issued"
    )
    scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.INSTANCE_WIDE)
    department = models.ForeignKey(
        "academic.Department", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="bans",
    )
    subject = models.ForeignKey(
        "academic.Subject", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="bans",
    )
    reason = models.TextField()
    duration = models.CharField(max_length=50, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    lifted_at = models.DateTimeField(null=True, blank=True)
    lifted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="bans_lifted",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"Ban on {self.user} ({self.scope})"

    @property
    def is_expired(self):
        return bool(self.expires_at and timezone.now() > self.expires_at)


class Appeal(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    ban = models.ForeignKey(Ban, on_delete=models.CASCADE, related_name="appeals")
    appellant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="appeals")
    reason = models.TextField()
    supporting_evidence = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reviewed_appeals",
    )
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"Appeal by {self.appellant} on ban #{self.ban_id}"
