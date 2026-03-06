"""Celery tasks for the materials app."""

from celery import shared_task


@shared_task
def generate_thumbnail(material_id):
    """
    Generate a thumbnail image for a material (e.g. first page of PDF).
    This is a placeholder — wire up pdf2image + Pillow when ready.
    """
    pass


@shared_task
def cleanup_orphaned_files():
    """
    Remove files on disk that no longer have associated Material or MaterialVersion records.
    Run periodically via Celery Beat.
    """
    pass
