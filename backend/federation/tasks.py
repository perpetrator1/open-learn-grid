"""
Celery tasks for federation.

Queues: federation_inbox (high-priority incoming activities), default (periodic tasks).
"""

import json
import logging
from datetime import timedelta

import requests
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Incoming activity processing
# ---------------------------------------------------------------------------


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="federation_inbox",
    name="federation.process_federated_activity",
)
def process_federated_activity(self, activity_pk: int):
    """Process a received FederatedActivity and update local state."""
    from .models import FederatedActivity, FederatedMaterial, Instance
    from .protocol import validate_activity, parse_material_shared

    try:
        activity = FederatedActivity.objects.get(pk=activity_pk)
    except FederatedActivity.DoesNotExist:
        logger.error("FederatedActivity %s not found", activity_pk)
        return

    activity.status = FederatedActivity.Status.PROCESSING
    activity.save(update_fields=["status"])

    try:
        payload = activity.payload
        is_valid, error = validate_activity(payload)
        if not is_valid:
            raise ValueError(f"Schema validation failed: {error}")

        atype = activity.activity_type

        if atype == FederatedActivity.ActivityType.MATERIAL_SHARED:
            _handle_material_shared(activity, payload)

        elif atype == FederatedActivity.ActivityType.MATERIAL_UPDATED:
            _handle_material_shared(activity, payload)  # same upsert logic

        elif atype == FederatedActivity.ActivityType.MATERIAL_REMOVED:
            _handle_material_removed(activity, payload)

        elif atype == FederatedActivity.ActivityType.USER_REPORTED:
            _handle_user_reported(activity, payload)

        elif atype == FederatedActivity.ActivityType.INSTANCE_STATS_UPDATE:
            _handle_stats_update(activity, payload)

        elif atype == FederatedActivity.ActivityType.INSTANCE_ANNOUNCEMENT:
            logger.info("Instance announcement from %s: %s", activity.from_instance.domain, payload.get("object", {}).get("title"))

        activity.status = FederatedActivity.Status.PROCESSED
        activity.processed_at = timezone.now()
        activity.save(update_fields=["status", "processed_at"])

    except Exception as exc:
        logger.exception("Error processing activity %s: %s", activity_pk, exc)
        activity.error_message = str(exc)
        activity.retry_count += 1

        if activity.retry_count <= 3:
            activity.status = FederatedActivity.Status.RECEIVED
            activity.save(update_fields=["status", "error_message", "retry_count"])
            raise self.retry(exc=exc, countdown=60 * (2 ** (activity.retry_count - 1)))
        else:
            activity.status = FederatedActivity.Status.FAILED
            activity.save(update_fields=["status", "error_message", "retry_count"])


def _handle_material_shared(activity, payload):
    from .models import FederatedMaterial
    from .protocol import parse_material_shared

    obj = payload.get("object", {})
    fields = parse_material_shared(obj)
    fields["source_instance"] = activity.from_instance

    original_id = fields.pop("original_id")
    original_created_at = fields.pop("original_created_at", None)
    if original_created_at:
        from dateutil.parser import parse as parse_dt
        try:
            fields["original_created_at"] = parse_dt(original_created_at)
        except Exception:
            pass

    FederatedMaterial.objects.update_or_create(
        original_id=original_id,
        source_instance=activity.from_instance,
        defaults={**fields, "is_removed": False},
    )


def _handle_material_removed(activity, payload):
    from .models import FederatedMaterial

    original_id = str((payload.get("object") or {}).get("id", ""))
    if original_id:
        FederatedMaterial.objects.filter(
            original_id=original_id, source_instance=activity.from_instance
        ).update(is_removed=True)


def _handle_user_reported(activity, payload):
    """Only process user_reported from trusted instances."""
    if activity.from_instance.trust_level != "trusted":
        logger.info("Ignoring user_reported from non-trusted instance %s", activity.from_instance.domain)
        return
    # Cross-instance reports are informational only for now
    logger.info("User reported activity received from trusted instance %s", activity.from_instance.domain)


def _handle_stats_update(activity, payload):
    from .models import Instance

    obj = payload.get("object", {})
    Instance.objects.filter(pk=activity.from_instance.pk).update(
        material_count=obj.get("material_count", 0),
        user_count=obj.get("user_count", 0),
        last_synced_stats_at=timezone.now(),
    )


# ---------------------------------------------------------------------------
# Outgoing / periodic tasks
# ---------------------------------------------------------------------------


@shared_task(name="federation.send_activity_to_instance")
def send_activity_to_instance(instance_pk: int, payload: dict, signature: str):
    """Send a signed activity to a single remote instance inbox."""
    from .models import Instance

    try:
        instance = Instance.objects.get(pk=instance_pk)
    except Instance.DoesNotExist:
        return

    inbox_url = f"https://{instance.domain}/api/federation/inbox/"
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()

    try:
        resp = requests.post(
            inbox_url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "X-Activity-Signature": signature,
            },
            timeout=15,
        )
        resp.raise_for_status()
        instance.update_last_seen()
    except requests.RequestException as exc:
        logger.warning("Failed to deliver activity to %s: %s", instance.domain, exc)


@shared_task(name="federation.broadcast_activity")
def broadcast_activity(payload: dict, signature: str, exclude_instance_pk: int = None):
    """Broadcast a signed activity to all trusted, reachable instances."""
    from .models import Instance

    qs = Instance.objects.filter(
        trust_level="trusted", is_reachable=True, is_active=True, is_home=False
    )
    if exclude_instance_pk:
        qs = qs.exclude(pk=exclude_instance_pk)

    for instance in qs:
        send_activity_to_instance.delay(instance.pk, payload, signature)


@shared_task(name="federation.health_check_instances")
def health_check_instances():
    """Ping all active instances and update is_reachable flag."""
    from .models import Instance
    from .discovery import WELL_KNOWN_PATH

    instances = Instance.objects.filter(is_active=True, is_home=False)
    for instance in instances:
        url = f"https://{instance.domain}{WELL_KNOWN_PATH}"
        reachable = False
        try:
            resp = requests.get(url, timeout=8, headers={"Accept": "application/json"})
            reachable = resp.status_code == 200
            if reachable:
                instance.update_last_seen()
        except requests.RequestException:
            pass

        if instance.is_reachable != reachable:
            instance.is_reachable = reachable
            instance.save(update_fields=["is_reachable"])


@shared_task(name="federation.send_instance_stats")
def send_instance_stats():
    """Broadcast instance_stats_update to all trusted instances (run daily)."""
    from .models import Instance
    from .protocol import build_activity, sign_activity
    from .discovery import build_home_instance_info

    info = build_home_instance_info()
    home_domain = getattr(settings, "INSTANCE_DOMAIN", "")
    payload = build_activity(
        "instance_stats_update",
        actor={"instance": home_domain, "user_id": None, "username": "system"},
        obj={
            "material_count": info["material_count"],
            "user_count": info["user_count"],
            "active_subjects": 0,
        },
    )
    signature = sign_activity(payload)
    broadcast_activity.delay(payload, signature)


@shared_task(name="federation.sync_instance_materials")
def sync_instance_materials(instance_pk: int):
    """
    Fetch latest materials from a trusted instance via their API.
    This is a lightweight re-sync; the main path is inbox-based activities.
    """
    from .models import Instance

    try:
        instance = Instance.objects.get(pk=instance_pk)
    except Instance.DoesNotExist:
        return

    if instance.trust_level != "trusted":
        logger.warning("sync_instance_materials called for non-trusted instance %s", instance.domain)
        return

    url = f"https://{instance.domain}/api/federation/materials/"
    try:
        resp = requests.get(url, timeout=30, params={"page_size": 100})
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.error("Failed to sync materials from %s: %s", instance.domain, exc)
        return

    results = data.get("results", []) if isinstance(data, dict) else data
    logger.info("Synced %d materials from %s", len(results), instance.domain)


@shared_task(name="federation.cleanup_old_activities")
def cleanup_old_activities():
    """Delete processed activities older than 90 days."""
    from .models import FederatedActivity

    cutoff = timezone.now() - timedelta(days=90)
    deleted, _ = FederatedActivity.objects.filter(
        status=FederatedActivity.Status.PROCESSED,
        created_at__lt=cutoff,
    ).delete()
    logger.info("Cleaned up %d old activities", deleted)
