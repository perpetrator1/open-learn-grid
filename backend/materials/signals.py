"""Django signals for the materials app."""

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender="materials.Material")
def trigger_thumbnail_generation(sender, instance, created, **kwargs):
    """Generate a thumbnail when a new material with a file is created."""
    if created and instance.file:
        from .tasks import generate_thumbnail
        generate_thumbnail.delay(instance.pk)
