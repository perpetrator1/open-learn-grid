"""Management command: manually sync from all trusted instances."""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Trigger a material sync from all trusted, reachable instances."

    def handle(self, *args, **kwargs):
        from federation.models import Instance
        from federation.tasks import sync_instance_materials

        instances = Instance.objects.filter(
            trust_level=Instance.TrustLevel.TRUSTED,
            is_active=True,
            is_home=False,
        )
        if not instances.exists():
            self.stdout.write("No trusted remote instances found.")
            return

        for instance in instances:
            sync_instance_materials.delay(instance.pk)
            self.stdout.write(f"Queued sync for {instance.domain}")

        self.stdout.write(self.style.SUCCESS(f"Queued sync for {instances.count()} instance(s)."))
