"""Utility to create notifications and push them over WebSocket."""
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

logger = logging.getLogger(__name__)

ICON_MAP = {
    "role_assigned": "user-check",
    "role_removed": "user-x",
    "material_verified": "shield-check",
    "material_rejected": "shield-x",
    "material_request_approved": "check-circle",
    "material_request_rejected": "x-circle",
    "academic_request_approved": "check-circle",
    "academic_request_rejected": "x-circle",
    "report_filed": "flag",
    "report_resolved": "check",
    "ban_issued": "ban",
    "ban_lifted": "unlock",
    "new_material_in_subject": "book-open",
    "mention": "at-sign",
    "system_announcement": "megaphone",
}


def create_notification(recipient, notification_type, title, body, link="",
                        related_object_type="", related_object_id=None):
    """Create a Notification and push it to the user's WebSocket channel."""
    icon = ICON_MAP.get(notification_type, "bell")
    notif = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        body=body,
        icon=icon,
        link=link,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
    )
    _push_ws(notif)
    return notif


def _push_ws(notif):
    """Push a notification to user's WebSocket channel."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        group_name = f"notifications_{notif.recipient_id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notification.message",
                "id": notif.id,
                "notification_type": notif.notification_type,
                "title": notif.title,
                "body": notif.body,
                "icon": notif.icon,
                "link": notif.link,
                "created_at": notif.created_at.isoformat(),
            },
        )
    except Exception as exc:
        logger.warning("WS push failed: %s", exc)
