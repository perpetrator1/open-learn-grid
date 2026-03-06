"""
Instance discovery logic.

Handles fetching and validating /.well-known/openlearngrid/instance from remote domains.
"""

import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

WELL_KNOWN_PATH = "/.well-known/openlearngrid/instance"
FETCH_TIMEOUT = 10  # seconds

REQUIRED_FIELDS = ["domain", "name", "public_key", "software_version"]


def fetch_instance_info(domain: str) -> dict:
    """
    Fetch and validate instance discovery info from a remote domain.
    Returns parsed dict on success, raises ValueError on failure.
    """
    # Normalise domain
    domain = domain.strip().lower().rstrip("/")
    url = f"https://{domain}{WELL_KNOWN_PATH}"

    try:
        resp = requests.get(url, timeout=FETCH_TIMEOUT, headers={"Accept": "application/json"})
        resp.raise_for_status()
    except requests.exceptions.SSLError:
        # Fallback to HTTP for development instances
        url_http = f"http://{domain}{WELL_KNOWN_PATH}"
        try:
            resp = requests.get(url_http, timeout=FETCH_TIMEOUT, headers={"Accept": "application/json"})
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise ValueError(f"Could not reach {domain}: {exc}") from exc
    except requests.RequestException as exc:
        raise ValueError(f"Could not reach {domain}: {exc}") from exc

    try:
        data = resp.json()
    except ValueError as exc:
        raise ValueError(f"Invalid JSON response from {domain}") from exc

    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from {domain}")

    for field in REQUIRED_FIELDS:
        if not data.get(field):
            raise ValueError(f"Missing required field '{field}' in response from {domain}")

    if data["domain"] != domain:
        # Allow subdomain mismatch only for development
        logger.warning("Domain mismatch: expected %s, got %s", domain, data["domain"])

    return data


def build_home_instance_info() -> dict:
    """Build the well-known response dict for this (home) instance."""
    from materials.models import Material
    from accounts.models import User
    from .models import Instance

    home = Instance.objects.filter(is_home=True).first()

    material_count = Material.objects.filter(verification_status="verified").count()
    user_count = User.objects.filter(is_active=True).count()

    return {
        "domain": getattr(settings, "INSTANCE_DOMAIN", ""),
        "name": home.name if home else getattr(settings, "INSTANCE_NAME", "Open Learn Grid"),
        "description": home.description if home else "",
        "software_version": "1.0.0",
        "public_key": home.public_key if home else "",
        "registration_open": home.registration_open if home else True,
        "requires_approval": home.requires_approval if home else False,
        "admin_email": home.admin_email if home else "",
        "material_count": material_count,
        "user_count": user_count,
        "supported_activity_types": [
            "material_shared",
            "material_removed",
            "user_reported",
            "instance_stats_update",
            "instance_announcement",
        ],
    }
