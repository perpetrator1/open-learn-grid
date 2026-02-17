"""
Settings module for Open Learn Grid.

Automatically loads appropriate settings based on environment.
"""

from decouple import config

# Load appropriate settings based on DJANGO_ENV variable
DJANGO_ENV = config('DJANGO_ENV', default='local')

if DJANGO_ENV == 'production':
    from .production import *  # noqa: F401, F403
else:
    from .local import *  # noqa: F401, F403
