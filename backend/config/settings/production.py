"""
Production settings for Open Learn Grid.

Override base settings for production deployment.
Uses S3-compatible storage for file uploads.
"""

import os
from decouple import config
from .base import *

# Security Settings for Production

SECRET_KEY = config('SECRET_KEY')
DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS').split(',')

# HTTPS & Security Headers

SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    'default-src': ("'self'",),
    'script-src': ("'self'", "cdn.jsdelivr.net"),
    'style-src': ("'self'", "'unsafe-inline'", "cdn.jsdelivr.net"),
}

X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# Database Configuration

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}


# AWS S3 / S3-Compatible Storage Configuration
# https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html

USE_S3 = config('USE_S3', default=True, cast=bool)

if USE_S3:
    # Storage settings
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'bucket_name': config('AWS_STORAGE_BUCKET_NAME'),
                'region_name': config('AWS_S3_REGION_NAME', default='us-east-1'),
                'use_ssl': config('AWS_S3_USE_SSL', default=True, cast=bool),
                'endpoint_url': config('AWS_S3_ENDPOINT_URL', default=None),
                'access_key': config('AWS_ACCESS_KEY_ID'),
                'secret_key': config('AWS_SECRET_ACCESS_KEY'),
                'default_acl': 'public-read',
                'object_parameters': {
                    'CacheControl': 'max-age=86400',
                },
            }
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
            'OPTIONS': {
                'bucket_name': config('AWS_STATIC_BUCKET_NAME', default=config('AWS_STORAGE_BUCKET_NAME')),
                'region_name': config('AWS_S3_REGION_NAME', default='us-east-1'),
                'use_ssl': config('AWS_S3_USE_SSL', default=True, cast=bool),
                'endpoint_url': config('AWS_S3_ENDPOINT_URL', default=None),
                'access_key': config('AWS_ACCESS_KEY_ID'),
                'secret_key': config('AWS_SECRET_ACCESS_KEY'),
                'default_acl': 'public-read',
                'object_parameters': {
                    'CacheControl': 'max-age=86400',
                },
            }
        }
    }
    
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f"https://{config('AWS_STORAGE_BUCKET_NAME')}.s3.amazonaws.com/static/"
    MEDIA_URL = f"https://{config('AWS_STORAGE_BUCKET_NAME')}.s3.amazonaws.com/media/"


# Email Configuration for Production

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')
SERVER_EMAIL = config('SERVER_EMAIL', default=config('DEFAULT_FROM_EMAIL'))


# CORS Configuration for Production

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS').split(',')
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS').split(',')
CORS_ALLOW_CREDENTIALS = True


# DRF Settings for Production

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'config.exceptions.custom_exception_handler',
}


# Cache Configuration for Production
# Configure Redis or Memcached for better performance

CACHES = {
    'default': {
        'BACKEND': config(
            'CACHE_BACKEND',
            default='django.core.cache.backends.locmem.LocMemCache',
        ),
        'LOCATION': config('CACHE_LOCATION', default='unique-snowflake'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Optional: Redis cache URL
REDIS_URL = config('REDIS_URL', default=None)
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }


# Logging - Production

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'audit.log'),
            'maxBytes': 1024 * 1024 * 15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        'audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Ensure logs directory exists
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)
