"""
Test settings — used by pytest and CI.
Inherits everything from base, overrides only what differs in test.
"""
from .base import *  # noqa: F401, F403

# Fast password hasher for tests
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# In-memory cache — no Redis required for tests
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Synchronous Celery — tasks execute inline
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Media files go to a temp directory (cleaned up after each test run)
import tempfile  # noqa: E402
MEDIA_ROOT = tempfile.mkdtemp()

# Email backend that captures emails without sending
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Disable migrations for speed; create tables directly from models
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Silence Django system checks that require a full DB
SILENCED_SYSTEM_CHECKS: list[str] = []

# Use a simpler logging config — suppress most output during tests
LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "handlers": {
        "null": {"class": "logging.NullHandler"},
    },
    "root": {
        "handlers": ["null"],
        "level": "CRITICAL",
    },
}
