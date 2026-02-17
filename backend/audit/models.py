"""
Models for the audit app.

Handles audit logs for all significant actions.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from accounts.models import User
import uuid
import json


class AuditAction(models.Model):
    """
    Definition of actions that can be audited.
    """
    
    class ActionCategory(models.TextChoices):
        ACCOUNT = 'account', _('Account Management')
        ACADEMIC = 'academic', _('Academic Operations')
        CONTENT = 'content', _('Content Management')
        MODERATION = 'moderation', _('Moderation')
        FEDERATION = 'federation', _('Federation')
        SYSTEM = 'system', _('System')
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Name of the action')
    )
    
    label = models.CharField(
        max_length=255,
        help_text=_('Human-readable label for the action')
    )
    
    category = models.CharField(
        max_length=50,
        choices=ActionCategory.choices,
        help_text=_('Category of the action')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of what this action represents')
    )
    
    is_sensitive = models.BooleanField(
        default=False,
        help_text=_('Whether this action involves sensitive data')
    )
    
    requires_reason = models.BooleanField(
        default=False,
        help_text=_('Whether a reason must be provided for this action')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return self.label


class AuditLog(models.Model):
    """
    Audit log for significant actions in the system.
    """
    
    class OperationType(models.TextChoices):
        CREATE = 'create', _('Create')
        READ = 'read', _('Read')
        UPDATE = 'update', _('Update')
        DELETE = 'delete', _('Delete')
        EXECUTE = 'execute', _('Execute')
        EXPORT = 'export', _('Export')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    action = models.ForeignKey(
        AuditAction,
        on_delete=models.PROTECT,
        related_name='logs',
        help_text=_('Action being audited')
    )
    
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text=_('User performing the action')
    )
    
    operation_type = models.CharField(
        max_length=20,
        choices=OperationType.choices,
        help_text=_('Type of operation')
    )
    
    # Generic foreign key to the affected object
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_('Type of object being acted upon')
    )
    
    object_id = models.UUIDField(
        null=True,
        blank=True,
        help_text=_('ID of the object being acted upon')
    )
    
    affected_object = GenericForeignKey('content_type', 'object_id')
    
    # Original and new values
    old_values = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Previous values of changed fields')
    )
    
    new_values = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('New values of changed fields')
    )
    
    # Request information
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_('IP address of the request')
    )
    
    user_agent = models.TextField(
        blank=True,
        help_text=_('User agent of the request')
    )
    
    request_data = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Request data (for sensitive operations)')
    )
    
    # Reason and details
    reason = models.TextField(
        blank=True,
        help_text=_('Reason for the action')
    )
    
    status_code = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('HTTP status code of the operation')
    )
    
    result = models.CharField(
        max_length=50,
        default='success',
        help_text=_('Result of the operation (success/failure)')
    )
    
    error_message = models.TextField(
        blank=True,
        help_text=_('Error message if the operation failed')
    )
    
    # Additional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata about the action')
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor']),
            models.Index(fields=['action']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['actor', '-created_at']),
            models.Index(fields=['result']),
        ]
    
    def __str__(self):
        return f"{self.action.label} by {self.actor.email if self.actor else 'Unknown'} at {self.created_at}"
    
    @property
    def summary(self):
        """Generate a summary of the audit log"""
        actor_name = self.actor.get_full_name() if self.actor else 'Unknown'
        return f"{actor_name} {self.get_operation_type_display().lower()}d {self.get_result_display()}"


class AuditViewer(models.Model):
    """
    Track who has accessed audit logs.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    viewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='audit_views',
        help_text=_('User viewing the audit logs')
    )
    
    audit_log = models.ForeignKey(
        AuditLog,
        on_delete=models.CASCADE,
        related_name='viewers',
        help_text=_('Audit log being viewed')
    )
    
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-viewed_at']
        unique_together = ('viewer', 'audit_log')
        indexes = [
            models.Index(fields=['viewer']),
        ]
    
    def __str__(self):
        return f"{self.viewer.email} viewed log {self.audit_log.id}"
