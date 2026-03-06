"""Celery application configuration for Open Learn Grid."""

import os
from celery import Celery

# Default to local settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("open_learn_grid")

# Load config from Django settings using CELERY_ namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
