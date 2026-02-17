"""
Models for the federation app.

Handles instance registry and cross-instance communication.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class FederatedInstance(models.Model):
    """
    Registry of federated Open Learn Grid instances.
    """
    
    class InstanceStatus(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        SUSPENDED = 'suspended', _('Suspended')
        PENDING = 'pending', _('Pending Verification')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Unique identifier for this instance')
    )
    
    instance_name = models.CharField(
        max_length=255,
        unique=True,
        help_text=_('Name of the federated instance')
    )
    
    domain = models.CharField(
        max_length=255,
        unique=True,
        help_text=_('Domain name of the instance')
    )
    
    api_url = models.URLField(
        help_text=_('Base URL for the instance API')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of the instance')
    )
    
    public_key = models.TextField(
        help_text=_('Public key for verifying signatures')
    )
    
    api_key = models.CharField(
        max_length=255,
        unique=True,
        help_text=_('API key for authenticating requests')
    )
    
    status = models.CharField(
        max_length=20,
        choices=InstanceStatus.choices,
        default=InstanceStatus.PENDING,
        help_text=_('Current status of the instance')
    )
    
    is_trusted = models.BooleanField(
        default=False,
        help_text=_('Whether this instance is trusted')
    )
    
    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Last time this instance was contacted')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['domain']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return self.instance_name


class FederationMessage(models.Model):
    """
    Messages exchanged between federated instances.
    """
    
    class MessageType(models.TextChoices):
        SYNC_REQUEST = 'sync_request', _('Synchronization Request')
        SYNC_RESPONSE = 'sync_response', _('Synchronization Response')
        QUERY = 'query', _('Query')
        NOTIFICATION = 'notification', _('Notification')
        ERROR = 'error', _('Error')
    
    class MessageStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        SENT = 'sent', _('Sent')
        DELIVERED = 'delivered', _('Delivered')
        FAILED = 'failed', _('Failed')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    from_instance = models.ForeignKey(
        FederatedInstance,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text=_('Source instance')
    )
    
    to_instance = models.ForeignKey(
        FederatedInstance,
        on_delete=models.CASCADE,
        related_name='received_messages',
        help_text=_('Destination instance')
    )
    
    message_type = models.CharField(
        max_length=50,
        choices=MessageType.choices,
        help_text=_('Type of message')
    )
    
    subject = models.CharField(
        max_length=255,
        help_text=_('Message subject')
    )
    
    payload = models.JSONField(
        help_text=_('Message payload')
    )
    
    status = models.CharField(
        max_length=20,
        choices=MessageStatus.choices,
        default=MessageStatus.PENDING,
        help_text=_('Current status of the message')
    )
    
    signature = models.TextField(
        blank=True,
        help_text=_('Digital signature for verification')
    )
    
    error_message = models.TextField(
        blank=True,
        help_text=_('Error details if delivery failed')
    )
    
    retry_count = models.IntegerField(
        default=0,
        help_text=_('Number of delivery attempts')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['from_instance']),
            models.Index(fields=['to_instance']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.get_message_type_display()} from {self.from_instance} to {self.to_instance}"


class FederationSync(models.Model):
    """
    Synchronization records between federated instances.
    """
    
    class SyncType(models.TextChoices):
        FULL = 'full', _('Full Sync')
        INCREMENTAL = 'incremental', _('Incremental Sync')
        BILATERAL = 'bilateral', _('Bilateral Sync')
    
    class SyncStatus(models.TextChoices):
        INITIATED = 'initiated', _('Initiated')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        PARTIAL = 'partial', _('Partial')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    instance = models.ForeignKey(
        FederatedInstance,
        on_delete=models.CASCADE,
        related_name='syncs',
        help_text=_('Federated instance being synced')
    )
    
    sync_type = models.CharField(
        max_length=20,
        choices=SyncType.choices,
        default=SyncType.INCREMENTAL,
        help_text=_('Type of synchronization')
    )
    
    status = models.CharField(
        max_length=20,
        choices=SyncStatus.choices,
        default=SyncStatus.INITIATED,
        help_text=_('Synchronization status')
    )
    
    records_synced = models.IntegerField(
        default=0,
        help_text=_('Number of records synchronized')
    )
    
    errors_count = models.IntegerField(
        default=0,
        help_text=_('Number of errors during synchronization')
    )
    
    data_synced = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Meta-information about synced data')
    )
    
    error_log = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Log of errors during sync')
    )
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['instance']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Sync {self.get_sync_type_display()} - {self.instance}"
