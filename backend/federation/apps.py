from django.apps import AppConfig


class FederationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "federation"
    verbose_name = "Federation"

    def ready(self):
        import federation.signals  # noqa: F401
