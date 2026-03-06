"""
Federation protocol: activity schema validation and HTTP signature construction/verification.
"""

import json
import uuid
import logging
from datetime import datetime, timezone, timedelta

from django.conf import settings
from .crypto import sign_payload, verify_signature, sha256_digest

logger = logging.getLogger(__name__)

SUPPORTED_ACTIVITY_TYPES = [
    "material_shared",
    "material_updated",
    "material_removed",
    "user_reported",
    "instance_announcement",
    "instance_stats_update",
]

# Maximum age for an activity signature (5 minutes)
MAX_SIGNATURE_AGE_SECONDS = 300


def build_activity(activity_type: str, actor: dict, obj: dict) -> dict:
    """Create a well-formed activity payload dict."""
    return {
        "id": str(uuid.uuid4()),
        "type": activity_type,
        "actor": actor,
        "object": obj,
        "published": datetime.now(timezone.utc).isoformat(),
    }


def sign_activity(payload: dict) -> str:
    """Sign an activity dict using the instance private key. Returns base64 signature."""
    private_key = getattr(settings, "INSTANCE_PRIVATE_KEY", "")
    if not private_key:
        logger.warning("INSTANCE_PRIVATE_KEY not set — activity will be unsigned")
        return ""
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return sign_payload(private_key, body)


def verify_activity_signature(payload: dict, signature: str, public_key_pem: str) -> bool:
    """Verify an activity signature against the sender's public key."""
    if not signature or not public_key_pem:
        return False
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return verify_signature(public_key_pem, body, signature)


def validate_activity(payload: dict) -> tuple[bool, str]:
    """
    Validate activity schema. Returns (is_valid, error_message).
    """
    if not isinstance(payload, dict):
        return False, "Payload must be a JSON object"
    if "id" not in payload:
        return False, "Missing 'id' field"
    if "type" not in payload:
        return False, "Missing 'type' field"
    if payload["type"] not in SUPPORTED_ACTIVITY_TYPES:
        return False, f"Unknown activity type: {payload['type']}"
    if "actor" not in payload:
        return False, "Missing 'actor' field"
    if "object" not in payload:
        return False, "Missing 'object' field"

    # Check timestamp age
    published = payload.get("published")
    if published:
        try:
            ts = datetime.fromisoformat(published.replace("Z", "+00:00"))
            age = (datetime.now(timezone.utc) - ts).total_seconds()
            if abs(age) > MAX_SIGNATURE_AGE_SECONDS:
                return False, f"Activity timestamp too old or too far in future ({age:.0f}s)"
        except ValueError:
            return False, f"Invalid published timestamp: {published}"

    return True, ""


def parse_material_shared(obj: dict) -> dict:
    """Extract FederatedMaterial fields from a material_shared activity object."""
    return {
        "original_id": str(obj.get("id", "")),
        "title": obj.get("title", ""),
        "description": obj.get("description", ""),
        "material_type": obj.get("material_type", ""),
        "subject_name": (obj.get("subject") or {}).get("name", ""),
        "semester_number": (obj.get("semester") or {}).get("number"),
        "department_name": (obj.get("department") or {}).get("name", ""),
        "file_url": obj.get("file_url", ""),
        "external_url": obj.get("external_url", "") or "",
        "tags": obj.get("tags", []),
        "uploaded_by_username": (obj.get("uploaded_by") or {}).get("username", ""),
        "verified_by_username": (obj.get("verified_by") or {}).get("username", ""),
        "verification_status": obj.get("verification_status", "verified"),
        "view_count": int(obj.get("view_count", 0)),
        "download_count": int(obj.get("download_count", 0)),
        "original_created_at": obj.get("created_at"),
    }
