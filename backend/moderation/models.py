"""
Models for the moderation app.

Handles reports, bans, and appeals.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from accounts.models import User
import uuid


class Report(models.Model):
    """
    User reports for moderation.
    """
    
    class ReportStatus(models.TextChoices):
        PENDING = 'pending', _('Pending Review')
        UNDER_REVIEW = 'under_review', _('Under Review')
        RESOLVED = 'resolved', _('Resolved')
        DISMISSED = 'dismissed', _('Dismissed')
        ESCALATED = 'escalated', _('Escalated')
    
    class ReportReason(models.TextChoices):
        HARASSMENT = 'harassment', _('Harassment')
        HATE_SPEECH = 'hate_speech', _('Hate Speech')
        MISINFORMATION = 'misinformation', _('Misinformation')
        SPAM = 'spam', _('Spam')
        INAPPROPRIATE_CONTENT = 'inappropriate', _('Inappropriate Content')
        COPYRIGHT = 'copyright', _('Copyright Violation')
        ACADEMIC_INTEGRITY = 'academic_integrity', _('Academic Integrity Violation')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    reporter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reports_submitted',
        help_text=_('User who submitted the report')
    )
    
    reason = models.CharField(
        max_length=50,
        choices=ReportReason.choices,
        help_text=_('Reason for the report')
    )
    
    description = models.TextField(
        help_text=_('Detailed description of the issue')
    )
    
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_('Type of content being reported')
    )
    
    object_id = models.UUIDField(
        null=True,
        blank=True,
        help_text=_('ID of the content being reported')
    )
    
    content_object = GenericForeignKey('content_type', 'object_id')
    
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
        help_text=_('Current status of the report')
    )
    
    evidence = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Evidence supporting the report')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['reason']),
            models.Index(fields=['reporter']),
        ]
    
    def __str__(self):
        return f"Report {self.id[:8]} - {self.get_reason_display()}"


class Ban(models.Model):
    """
    User bans and sanctions.
    """
    
    class BanType(models.TextChoices):
        TEMPORARY = 'temporary', _('Temporary Ban')
        PERMANENT = 'permanent', _('Permanent Ban')
        CONTENT_RESTRICTION = 'content_restriction', _('Content Restriction')
        FEATURE_RESTRICTION = 'feature_restriction', _('Feature Restriction')
    
    class BanStatus(models.TextChoices):
        ACTIVE = 'active', _('Active')
        EXPIRED = 'expired', _('Expired')
        LIFTED = 'lifted', _('Lifted')
        PENDING = 'pending', _('Pending')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bans',
        help_text=_('Banned user')
    )
    
    ban_type = models.CharField(
        max_length=50,
        choices=BanType.choices,
        help_text=_('Type of ban')
    )
    
    reason = models.TextField(
        help_text=_('Reason for the ban')
    )
    
    banned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='bans_issued',
        help_text=_('Moderator who issued the ban')
    )
    
    related_report = models.ForeignKey(
        Report,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resulting_bans',
        help_text=_('Report that led to this ban')
    )
    
    status = models.CharField(
        max_length=20,
        choices=BanStatus.choices,
        default=BanStatus.PENDING,
        help_text=_('Current status of the ban')
    )
    
    issued_at = models.DateTimeField(auto_now_add=True)
    starts_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the ban takes effect')
    )
    
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the ban expires (null for permanent)')
    )
    
    scope = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Scope of the ban (e.g., which features are restricted)')
    )
    
    class Meta:
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['-expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_ban_type_display()}"


class Appeal(models.Model):
    """
    Appeals for bans or reports.
    """
    
    class AppealStatus(models.TextChoices):
        PENDING = 'pending', _('Pending Review')
        UNDER_REVIEW = 'under_review', _('Under Review')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appeals',
        help_text=_('User appealing')
    )
    
    ban = models.ForeignKey(
        Ban,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='appeals',
        help_text=_('Ban being appealed')
    )
    
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='appeals',
        help_text=_('Report being appealed')
    )
    
    reason = models.TextField(
        help_text=_('Reason for the appeal')
    )
    
    evidence = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Evidence supporting the appeal')
    )
    
    status = models.CharField(
        max_length=20,
        choices=AppealStatus.choices,
        default=AppealStatus.PENDING,
        help_text=_('Current status of the appeal')
    )
    
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_appeals',
        help_text=_('Moderator who reviewed the appeal')
    )
    
    review_notes = models.TextField(
        blank=True,
        help_text=_('Notes from the review')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Appeal {self.id[:8]} - {self.get_status_display()}"
