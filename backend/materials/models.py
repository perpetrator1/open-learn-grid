"""
Models for the materials app.

Handles course materials including notes, question papers, and other resources.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from academic.models import Course, Department, Semester, Subject
from accounts.models import User


class MaterialType(models.Model):
    """Type of academic material."""

    class TypeName(models.TextChoices):
        NOTES = "Notes", _("Notes")
        QUESTION_PAPER = "Question Paper", _("Question Paper")
        ASSIGNMENT = "Assignment", _("Assignment")
        REFERENCE = "Reference", _("Reference")
        TUTORIAL = "Tutorial", _("Tutorial")
        OTHER = "Other", _("Other")

    name = models.CharField(max_length=50, choices=TypeName.choices, unique=True)
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text=_("Lucide-react icon name"),
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Lowercase tag for categorising materials."""

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        self.name = self.name.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Material(models.Model):
    """The main model representing an uploaded academic resource."""

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        VERIFIED = "verified", _("Verified")
        REJECTED = "rejected", _("Rejected")
        REVISION_REQUESTED = "revision_requested", _("Revision Requested")

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    material_type = models.ForeignKey(
        MaterialType, on_delete=models.PROTECT, related_name="materials"
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="materials"
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="materials",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="materials",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="materials",
    )
    file = models.FileField(
        upload_to="materials/%Y/%m/", null=True, blank=True
    )
    external_url = models.URLField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="materials")
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_materials",
    )
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_materials",
    )
    verification_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    verification_note = models.TextField(null=True, blank=True)
    upload_source_instance = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_("Domain of the federated instance this was uploaded from"),
    )
    view_count = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    is_federated_shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["subject", "semester"]),
            models.Index(fields=["department"]),
            models.Index(fields=["material_type"]),
            models.Index(fields=["verification_status"]),
            models.Index(fields=["uploaded_by"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return self.title


class MaterialVersion(models.Model):
    """Version history for a material."""

    material = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveSmallIntegerField()
    file = models.FileField(upload_to="materials/versions/%Y/%m/")
    change_note = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="material_versions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version_number"]
        unique_together = ("material", "version_number")

    def __str__(self):
        return f"{self.material.title} v{self.version_number}"


class MaterialRequest(models.Model):
    """Student request to add, update, or remove a material."""

    class RequestType(models.TextChoices):
        ADD = "add", _("Add")
        REMOVE = "remove", _("Remove")
        UPDATE = "update", _("Update")

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")

    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="material_requests"
    )
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    material = models.ForeignKey(
        Material,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requests",
    )
    proposed_data = models.JSONField(
        default=dict,
        help_text=_("Material fields for add/update requests"),
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_material_requests",
    )
    review_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["requester"]),
        ]

    def __str__(self):
        return f"{self.get_request_type_display()} request by {self.requester}"
