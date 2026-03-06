"""Notifications app models: Notification, NotificationPreference."""
from django.db import models
from django.utils import timezone
from accounts.models import User

NOTIFICATION_TYPES = [
    ("role_assigned", "Role Assigned"),
    ("role_removed", "Role Removed"),
    ("material_verified", "Material Verified"),
    ("material_rejected", "Material Rejected"),
    ("material_request_approved", "Material Request Approved"),
    ("material_request_rejected", "Material Request Rejected"),
    ("academic_request_approved", "Academic Request Approved"),
    ("academic_request_rejected", "Academic Request Rejected"),
    ("report_filed", "Report Filed"),
    ("report_resolved", "Report Resolved"),
    ("ban_issued", "Ban Issued"),
    ("ban_lifted", "Ban Lifted"),
    ("new_material_in_subject", "New Material in Subject"),
    ("mention", "Mention"),
    ("system_announcement", "System Announcement"),
]


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=60, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    icon = models.CharField(max_length=50, default="bell")
    link = models.CharField(max_length=300, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "-created_at"]),
            models.Index(fields=["recipient", "is_read"]),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient}"

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])


class NotificationPreference(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    notification_type = models.CharField(max_length=60, choices=NOTIFICATION_TYPES)
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "notification_type")
        ordering = ["notification_type"]

    def __str__(self):
        return f"{self.user} / {self.notification_type}"
