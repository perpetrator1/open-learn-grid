"""
Federation models for Open Learn Grid.

Handles instance registry, federated activities, federated materials, and instance blocks.
"""

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from accounts.models import User


class Instance(models.Model):
    """Registry entry for a federated Open Learn Grid instance."""

    class TrustLevel(models.TextChoices):
        TRUSTED = "trusted", _("Trusted")
        NEUTRAL = "neutral", _("Neutral")
        BLOCKED = "blocked", _("Blocked")

    domain = models.CharField(max_length=255, unique=True, help_text="e.g. learngrid.university.edu")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="instance-logos/%Y/%m/", null=True, blank=True)
    software_version = models.CharField(max_length=50, blank=True)
    admin_email = models.EmailField(blank=True)
    public_key = models.TextField(blank=True, help_text="RSA public key PEM")
    keypair_created_at = models.DateTimeField(null=True, blank=True)
    trust_level = models.CharField(
        max_length=20, choices=TrustLevel.choices, default=TrustLevel.NEUTRAL,
    )
    is_home = models.BooleanField(default=False)
    registration_open = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=False)
    material_count = models.PositiveIntegerField(default=0)
    user_count = models.PositiveIntegerField(default=0)
    last_synced_stats_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_reachable = models.BooleanField(default=True)
    added_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="added_instances",
    )
    added_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-added_at"]
        indexes = [
            models.Index(fields=["domain"]),
            models.Index(fields=["trust_level"]),
            models.Index(fields=["is_home"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.domain})"

    def update_last_seen(self):
        self.last_seen_at = timezone.now()
        self.save(update_fields=["last_seen_at"])


class FederatedActivity(models.Model):
    """Records an activity received from or sent to another instance."""

    class ActivityType(models.TextChoices):
        MATERIAL_SHARED = "material_shared", _("Material Shared")
        MATERIAL_UPDATED = "material_updated", _("Material Updated")
        MATERIAL_REMOVED = "material_removed", _("Material Removed")
        USER_REPORTED = "user_reported", _("User Reported")
        INSTANCE_ANNOUNCEMENT = "instance_announcement", _("Instance Announcement")
        INSTANCE_STATS_UPDATE = "instance_stats_update", _("Instance Stats Update")

    class Status(models.TextChoices):
        RECEIVED = "received", _("Received")
        PROCESSING = "processing", _("Processing")
        PROCESSED = "processed", _("Processed")
        FAILED = "failed", _("Failed")

    from_instance = models.ForeignKey(
        Instance, on_delete=models.CASCADE, related_name="sent_activities",
    )
    to_instance = models.ForeignKey(
        Instance, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="received_activities",
    )
    activity_id = models.CharField(max_length=255, unique=True)
    activity_type = models.CharField(max_length=50, choices=ActivityType.choices)
    payload = models.JSONField()
    signature = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["activity_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["from_instance"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.activity_type} from {self.from_instance.domain} [{self.status}]"


class FederatedMaterial(models.Model):
    """Denormalized copy of a material from another instance."""

    original_id = models.CharField(max_length=255)
    source_instance = models.ForeignKey(
        Instance, on_delete=models.CASCADE, related_name="federated_materials",
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    material_type = models.CharField(max_length=100, blank=True)
    subject_name = models.CharField(max_length=255, blank=True)
    semester_number = models.PositiveSmallIntegerField(null=True, blank=True)
    department_name = models.CharField(max_length=255, blank=True)
    file_url = models.URLField(max_length=2000)
    external_url = models.URLField(max_length=2000, blank=True)
    tags = models.JSONField(default=list, blank=True)
    uploaded_by_username = models.CharField(max_length=150)
    verified_by_username = models.CharField(max_length=150, blank=True)
    verification_status = models.CharField(max_length=50, default="verified")
    view_count = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)
    original_created_at = models.DateTimeField(null=True, blank=True)
    synced_at = models.DateTimeField(auto_now_add=True)
    last_updated_at = models.DateTimeField(auto_now=True)
    is_removed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-synced_at"]
        unique_together = [("original_id", "source_instance")]
        indexes = [
            models.Index(fields=["material_type"]),
            models.Index(fields=["verification_status"]),
            models.Index(fields=["source_instance", "is_removed"]),
        ]

    def __str__(self):
        return f"{self.title} [{self.source_instance.domain}]"


class InstanceBlock(models.Model):
    """Records manual or auto blocks of instances."""

    class BlockType(models.TextChoices):
        MANUAL = "manual", _("Manual")
        AUTO_SPAM = "auto_spam_detection", _("Auto (Spam Detection)")
        REPORTED = "reported", _("Reported")

    instance = models.OneToOneField(
        Instance, on_delete=models.CASCADE, related_name="block",
    )
    blocked_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="instance_blocks",
    )
    reason = models.TextField()
    block_type = models.CharField(max_length=30, choices=BlockType.choices, default=BlockType.MANUAL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Block: {self.instance.domain} ({self.block_type})"
