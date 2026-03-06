"""Comprehensive health check endpoint for Open Learn Grid."""

import time
import logging
from django.db import connection
from django.core.cache import cache
from django.http import JsonResponse
from django.views import View

logger = logging.getLogger(__name__)


def _check_database() -> dict:
    start = time.monotonic()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return {"status": "up", "latency_ms": round((time.monotonic() - start) * 1000, 2)}
    except Exception as exc:
        logger.error("Health check: DB failed: %s", exc)
        return {"status": "down", "error": str(exc)}


def _check_redis() -> dict:
    start = time.monotonic()
    try:
        cache.set("_health_check", "ok", timeout=5)
        val = cache.get("_health_check")
        if val != "ok":
            raise RuntimeError("Cache round-trip failed")
        return {"status": "up", "latency_ms": round((time.monotonic() - start) * 1000, 2)}
    except Exception as exc:
        logger.error("Health check: Redis failed: %s", exc)
        return {"status": "down", "error": str(exc)}


def _check_storage() -> dict:
    import os
    from django.conf import settings
    try:
        media_root = getattr(settings, "MEDIA_ROOT", None)
        if media_root:
            writable = os.access(media_root, os.W_OK)
            return {"status": "up", "writable": writable}
        return {"status": "up", "writable": None, "note": "S3 or no media root configured"}
    except Exception as exc:
        return {"status": "degraded", "error": str(exc)}


def _check_celery() -> dict:
    try:
        from config.celery import app as celery_app
        inspect = celery_app.control.inspect(timeout=2)
        active = inspect.active()
        if active is None:
            return {"status": "degraded", "workers": 0, "note": "No response from workers"}
        worker_count = len(active)
        return {"status": "up", "workers": worker_count}
    except Exception as exc:
        return {"status": "degraded", "error": str(exc), "note": "Celery ping failed"}


def _check_federation() -> dict:
    try:
        from federation.models import Instance
        total = Instance.objects.filter(is_home=False).count()
        unreachable = Instance.objects.filter(is_home=False, is_reachable=False).count()
        return {
            "status": "up",
            "reachable_instances": total - unreachable,
            "unreachable": unreachable,
        }
    except Exception as exc:
        return {"status": "degraded", "error": str(exc)}


class HealthCheckView(View):
    """
    GET /api/health/ — returns component-level health status.
    Returns 200 if all critical components are up, 503 otherwise.
    """

    def get(self, request):
        from django.conf import settings

        db = _check_database()
        redis = _check_redis()
        storage = _check_storage()
        celery = _check_celery()
        federation = _check_federation()

        overall = "healthy"
        if db["status"] != "up" or redis["status"] != "up":
            overall = "unhealthy"
        elif celery.get("status") == "degraded" or storage.get("status") == "degraded":
            overall = "degraded"

        data = {
            "status": overall,
            "version": getattr(settings, "APP_VERSION", "1.0.0"),
            "environment": "production" if not settings.DEBUG else "development",
            "components": {
                "database": db,
                "redis": redis,
                "storage": storage,
                "celery": celery,
                "federation": federation,
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        status_code = 200 if overall != "unhealthy" else 503
        return JsonResponse(data, status=status_code)


class ReadinessView(View):
    """
    GET /api/readiness/ — lightweight k8s readiness probe.
    Only checks DB connectivity.
    """

    def get(self, request):
        db = _check_database()
        if db["status"] == "up":
            return JsonResponse({"status": "ready"})
        return JsonResponse({"status": "not ready", "reason": db.get("error")}, status=503)


class LivenessView(View):
    """GET /api/liveness/ — lightweight k8s liveness probe."""

    def get(self, request):
        return JsonResponse({"status": "alive"})
