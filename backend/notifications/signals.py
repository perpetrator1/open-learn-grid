"""Auto-create notifications on model events."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender="materials.MaterialRequest")
def on_material_request_reviewed(sender, instance, **kwargs):
    from .utils import create_notification
    if instance.status == "pending":
        return
    label = "approved" if instance.status == "approved" else "rejected"
    create_notification(
        recipient=instance.requester,
        notification_type=f"material_request_{label}",
        title=f"Material request {label}",
        body=f"Your material request has been {label}.",
        link="/materials",
    )


@receiver(post_save, sender="materials.Material")
def on_material_verified(sender, instance, **kwargs):
    from .utils import create_notification
    if instance.verification_status not in ("verified", "rejected"):
        return
    if not instance.uploaded_by_id:
        return
    ntype = "material_verified" if instance.verification_status == "verified" else "material_rejected"
    create_notification(
        recipient=instance.uploaded_by,
        notification_type=ntype,
        title=f"Material {instance.verification_status}",
        body=f"\"{instance.title}\" has been {instance.verification_status}.",
        link=f"/materials/{instance.pk}",
        related_object_type="material",
        related_object_id=instance.pk,
    )


@receiver(post_save, sender="academic.AcademicRequest")
def on_academic_request_reviewed(sender, instance, **kwargs):
    from .utils import create_notification
    if instance.status == "pending":
        return
    label = "approved" if instance.status == "approved" else "rejected"
    create_notification(
        recipient=instance.requester,
        notification_type=f"academic_request_{label}",
        title=f"Academic request {label}",
        body=f"Your academic request has been {label}.",
        link="/admin/academic",
    )


@receiver(post_save, sender="accounts.RoleRequest")
def on_role_request_reviewed(sender, instance, **kwargs):
    from .utils import create_notification
    if instance.status == "pending":
        return
    label = "approved" if instance.status == "approved" else "rejected"
    create_notification(
        recipient=instance.user,
        notification_type=f"role_request_{label}" if False else "role_assigned" if label == "approved" else "role_removed",
        title=f"Role request {label}",
        body=f"Your request for the role \"{instance.requested_role.name}\" has been {label}.",
        link="/settings/profile",
    )


@receiver(post_save, sender="accounts.UserRole")
def on_user_role_assigned(sender, instance, created, **kwargs):
    if not created:
        return
    from .utils import create_notification
    create_notification(
        recipient=instance.user,
        notification_type="role_assigned",
        title="Role assigned",
        body=f"You have been assigned the role \"{instance.role.name}\".",
        link="/settings/profile",
    )


@receiver(post_save, sender="moderation.Ban")
def on_ban_created(sender, instance, created, **kwargs):
    if not created:
        return
    from .utils import create_notification
    create_notification(
        recipient=instance.user,
        notification_type="ban_issued",
        title="Account restriction",
        body=f"A {instance.scope} restriction has been applied to your account.",
        link="/",
    )


@receiver(post_save, sender="moderation.Report")
def on_report_created(sender, instance, created, **kwargs):
    if not created:
        return
    from .utils import create_notification
    from accounts.models import User, UserRole
    from accounts.permissions import MODERATION_PERMISSIONS
    # Notify moderators
    mod_perm = MODERATION_PERMISSIONS[0] if MODERATION_PERMISSIONS else "moderation.view_reports"
    for ur in UserRole.objects.filter(role__permissions__contains=[mod_perm]).select_related("user"):
        create_notification(
            recipient=ur.user,
            notification_type="report_filed",
            title="New report filed",
            body=f"A new {instance.reported_item_type} report has been submitted.",
            link="/moderation",
        )
