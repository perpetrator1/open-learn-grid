"""Management command: setup home instance record."""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Set up or update the home Instance record."

    def add_arguments(self, parser):
        parser.add_argument("--domain", required=True)
        parser.add_argument("--name", default="Open Learn Grid")
        parser.add_argument("--description", default="")
        parser.add_argument("--admin-email", default="")

    def handle(self, *args, **kwargs):
        from django.conf import settings
        from federation.models import Instance

        domain = kwargs["domain"]
        name = kwargs["name"]
        description = kwargs["description"]
        admin_email = kwargs["admin_email"]

        # Ensure only one home instance
        Instance.objects.filter(is_home=True).update(is_home=False)

        home, created = Instance.objects.update_or_create(
            domain=domain,
            defaults={
                "name": name,
                "description": description,
                "admin_email": admin_email,
                "is_home": True,
                "is_active": True,
                "is_reachable": True,
                "trust_level": Instance.TrustLevel.TRUSTED,
            },
        )
        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} home instance: {home}"))
