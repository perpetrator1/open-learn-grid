"""
Models for the notifications app.

Handles in-app notification system.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from accounts.models import User
import uuid


class NotificationTemplate(models.Model):
    """
    Templates for different types of notifications.
    """
    
    class NotificationType(models.TextChoices):
        SYSTEM = 'system', _('System')
        ACADEMIC = 'academic', _('Academic')
        SOCIAL = 'social', _('Social')
        MODERATION = 'moderation', _('Moderation')
        FEDERATION = 'federation', _('Federation')
        ALERT = 'alert', _('Alert')
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Internal template name')
    )
    
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        help_text=_('Type of notification')
    )
    
    title_template = models.CharField(
        max_length=255,
        help_text=_('Template for notification title')
    )
    
    message_template = models.TextField(
        help_text=_('Template for notification message (supports variable substitution)')
    )
    
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Icon class or emoji for the notification')
    )
    
    priority = models.IntegerField(
        default=0,
        help_text=_('Priority level for display ordering')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this template is active')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-priority', 'name']
        indexes = [
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return self.name


class Notification(models.Model):
    """
    Individual notifications sent to users.
    """
    
    class NotificationStatus(models.TextChoices):
        UNREAD = 'unread', _('Unread')
        READ = 'read', _('Read')
        ARCHIVED = 'archived', _('Archived')
        DELETED = 'deleted', _('Deleted')
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text=_('User receiving the notification')
    )
    
    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        help_text=_('Template used for this notification')
    )
    
    title = models.CharField(
        max_length=255,
        help_text=_('Notification title')
    )
    
    message = models.TextField(
        help_text=_('Notification message')
    )
    
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Icon for the notification')
    )
    
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional data for the notification')
    )
    
    # Generic foreign key to related content
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_('Type of related content')
    )
    
    object_id = models.UUIDField(
        null=True,
        blank=True,
        help_text=_('ID of the related content')
    )
    
    related_object = GenericForeignKey('content_type', 'object_id')
    
    status = models.CharField(
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.UNREAD,
        help_text=_('Current status of the notification')
    )
    
    action_url = models.URLField(
        blank=True,
        help_text=_('URL to perform related action')
    )
    
    action_label = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Label for the action button')
    )
    
    priority = models.IntegerField(
        default=0,
        help_text=_('Priority level for display')
    )
    
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the notification was read')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the notification expires')
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['recipient', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} to {self.recipient.email}"
    
    @property
    def is_read(self):
        """Check if notification is read"""
        return self.status == self.NotificationStatus.READ


class NotificationPreference(models.Model):
    """
    User preferences for notifications.
    """
    
    class DeliveryChannel(models.TextChoices):
        IN_APP = 'in_app', _('In-App')
        EMAIL = 'email', _('Email')
        PUSH = 'push', _('Push Notification')
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preference',
        primary_key=True,
        help_text=_('Associated user')
    )
    
    enabled_channels = models.JSONField(
        default=lambda: [DeliveryChannel.IN_APP],
        help_text=_('Enabled notification channels')
    )
    
    default_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Default notification preferences by type')
    )
    
    # Notification type toggles
    system_notifications = models.BooleanField(
        default=True,
        help_text=_('Receive system notifications')
    )
    
    academic_notifications = models.BooleanField(
        default=True,
        help_text=_('Receive academic notifications')
    )
    
    social_notifications = models.BooleanField(
        default=True,
        help_text=_('Receive social notifications')
    )
    
    moderation_notifications = models.BooleanField(
        default=True,
        help_text=_('Receive moderation notifications')
    )
    
    federation_notifications = models.BooleanField(
        default=True,
        help_text=_('Receive federation notifications')
    )
    
    alert_notifications = models.BooleanField(
        default=True,
        help_text=_('Receive alert notifications')
    )
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(
        default=False,
        help_text=_('Whether quiet hours are enabled')
    )
    
    quiet_hours_start = models.TimeField(
        null=True,
        blank=True,
        help_text=_('Start time for quiet hours')
    )
    
    quiet_hours_end = models.TimeField(
        null=True,
        blank=True,
        help_text=_('End time for quiet hours')
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Notification Preference')
        verbose_name_plural = _('Notification Preferences')
    
    def __str__(self):
        return f"Notification preferences for {self.user.email}"
