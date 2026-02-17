# Open Learn Grid - Django Backend Setup Guide

## Overview

This guide documents the complete Django backend setup for Open Learn Grid, a federated learning management system. The backend is built with Django 5.0, Django REST Framework, and includes comprehensive support for multi-tenant federation, moderation, and audit logging.

## Project Structure

```
backend/
├── config/                     # Main Django configuration
│   ├── settings/              # Environment-specific settings
│   │   ├── base.py            # Shared base settings
│   │   ├── local.py           # Development settings
│   │   ├── production.py      # Production settings
│   │   └── __init__.py        # Auto-load appropriate settings
│   ├── urls.py                # URL configuration
│   ├── wsgi.py                # WSGI application
│   ├── asgi.py                # ASGI application
│   └── exceptions.py          # Custom DRF exception handler
├── accounts/                  # User authentication and profiles
├── academic/                  # Departments, courses, subjects
├── materials/                 # Study materials, notes, exams
├── federation/                # Cross-instance federation
├── moderation/                # Reports, bans, appeals
├── notifications/             # In-app notification system
├── audit/                     # Audit logging
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
└── .env.example              # Environment variable template
```

## Apps Overview

### 1. **accounts** - User Management
Handles user authentication, profiles, and role management.

**Models:**
- `User` - Custom user model (email-based authentication)
- `UserProfile` - Extended profile information
- `Role` - Custom role definitions
- `UserRole` - User-role associations

**Features:**
- Email-based authentication
- Multiple role support (Student, Instructor, Admin, Moderator)
- Profile picture uploads
- Email verification tracking
- Customizable user roles and permissions

### 2. **academic** - Academic Structure
Manages academic organization and course offerings.

**Models:**
- `Department` - Academic departments/faculties
- `Semester` - Academic terms/semesters
- `Subject` - Subjects/courses in the curriculum
- `Course` - Specific offerings of subjects

**Features:**
- Hierarchical academic structure
- Semester-based course scheduling
- Multi-instructor support
- Course capacity management
- Generic course metadata (schedule, syllabus)

### 3. **materials** - Course Materials
Handles study resources, notes, and exam papers.

**Models:**
- `MaterialType` - Categories of materials
- `CourseMaterial` - Study materials (PDFs, documents)
- `QuestionPaper` - Exam questions and assignments
- `Note` - User-created study notes

**Features:**
- Multiple material types (notes, papers, resources)
- Access level control (Public, Enrolled, Restricted)
- Automatic tracking of views and downloads
- Difficulty levels for question papers
- Solution files for exams

### 4. **federation** - Cross-Instance Federation
Enables communication and synchronization between federated instances.

**Models:**
- `FederatedInstance` - Registry of connected instances
- `FederationMessage` - Messages between instances
- `FederationSync` - Synchronization records

**Features:**
- Instance discovery and registration
- Secure API-key based authentication
- Message queuing with retry logic
- Sync tracking and error logging
- Instance trust levels

### 5. **moderation** - Content Moderation
Handles user reports, bans, and appeals.

**Models:**
- `Report` - User reports of issues
- `Ban` - User bans and sanctions
- `Appeal` - Appeals against reports/bans

**Features:**
- Multiple report categories (harassment, misinformation, etc.)
- Temporary and permanent bans
- Ban expiration scheduling
- Appeal workflow with review tracking
- Evidence attachment support

### 6. **notifications** - In-App Notifications
Manages user notifications and preferences.

**Models:**
- `NotificationTemplate` - Reusable notification templates
- `Notification` - Individual notifications sent to users
- `NotificationPreference` - User notification settings

**Features:**
- Template-based notification creation
- Multiple notification channels (in-app, email, push)
- Notification categorization
- Quiet hours configuration
- Preference management per notification type

### 7. **audit** - Audit Logging
Records all significant system actions for compliance and debugging.

**Models:**
- `AuditAction` - Definition of auditable actions
- `AuditLog` - Records of actions performed
- `AuditViewer` - Tracking of audit log access

**Features:**
- Comprehensive action tracking
- Before/after value comparison
- IP address and user agent logging
- Sensitive data flagging
- Failure/error tracking
- Audit log access tracking

## Configuration: Settings Structure

### Environment-Based Configuration

The backend uses a modular settings structure that automatically loads appropriate configurations based on the `DJANGO_ENV` environment variable.

#### Base Settings (`config/settings/base.py`)
Contains shared configuration for both development and production:
- Database connection pooling
- JWT authentication defaults
- CORS and CSRF settings
- Logging configuration
- Email backend defaults
- REST Framework defaults

#### Development Settings (`config/settings/local.py`)
Development-specific overrides:
- `DEBUG = True`
- Local file storage for uploads
- Extended JWT token lifetimes
- Console email backend
- Verbose logging
- SessionAuthentication for testing
- `django-extensions` for development tools

#### Production Settings (`config/settings/production.py`)
Production-specific settings:
- `DEBUG = False`
- S3-compatible storage for uploads
- HTTPS redirects and security headers
- HSTS configuration
- Restrictive JWT settings
- SMTP email backend
- Cache configuration (Redis or Memcached)
- Optimized database connection settings

## Installation & Setup

### 1. Prerequisites
- Python 3.10+
- PostgreSQL database
- Virtual environment

### 2. Create Virtual Environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy the example .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 5. Create Database & Migrate
```bash
# For PostgreSQL
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 6. Create Initial Data (Optional)
```bash
# Create fixture data for audit actions, roles, etc.
python manage.py loaddata initial_data
```

### 7. Run Development Server
```bash
python manage.py runserver
```

## Environment Configuration

### Development (.env)
```bash
DJANGO_ENV=local
SECRET_KEY=your-insecure-key-for-development
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend
POSTGRES_DB=openlearngrid_dev
POSTGRES_USER=openlearngrid
POSTGRES_PASSWORD=securepassword
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Production (.env)
```bash
DJANGO_ENV=production
SECRET_KEY=your-very-secure-production-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECURE_SSL_REDIRECT=True

# Database
POSTGRES_DB=openlearngrid
POSTGRES_USER=pguser
POSTGRES_PASSWORD=very-secure-password
POSTGRES_HOST=db.example.com
POSTGRES_PORT=5432

# S3 Storage
USE_S3=True
AWS_STORAGE_BUCKET_NAME=openlearngrid-uploads
AWS_S3_REGION_NAME=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_ENDPOINT_URL=https://s3.amazonaws.com

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@openlearngrid.local

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379/0

# CORS & Origins
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## File Storage Configuration

### Development: Local Filesystem
By default, development uses local filesystem storage (`django.core.files.storage.FileSystemStorage`). 
Uploaded files go to:
- User profile pictures: `media/profile_pictures/`
- Course materials: `media/course_materials/`
- Question papers: `media/question_papers/`
- Question solutions: `media/question_papers/solutions/`

### Production: AWS S3 / S3-Compatible
Production is configured for S3-compatible storage with the following settings:
```python
STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        'OPTIONS': {
            'bucket_name': AWS_STORAGE_BUCKET_NAME,
            'region_name': AWS_S3_REGION_NAME,
            'access_key': AWS_ACCESS_KEY_ID,
            'secret_key': AWS_SECRET_ACCESS_KEY,
        }
    }
}
```

**S3-Compatible Services:**
- AWS S3
- MinIO
- DigitalOcean Spaces
- Wasabi
- Backblaze B2

Configure `AWS_S3_ENDPOINT_URL` for non-AWS providers.

## API Authentication

The backend uses JWT (JSON Web Tokens) for authentication:

### Obtaining Tokens
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Using Tokens
Include the access token in the `Authorization` header:
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/resource/
```

### Token Refresh
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh_token>"}'
```

## Database Models & Migrations

### Creating Migrations
```bash
# Create migrations for model changes
python manage.py makemigrations

# View SQL for migrations (optional)
python manage.py sqlmigrate app_name migration_number
```

### Applying Migrations
```bash
# Apply all pending migrations
python manage.py migrate

# Apply specific app migrations
python manage.py migrate app_name

# Rollback migrations
python manage.py migrate app_name 0001  # Target migration number
```

### Creating Initial Data
```bash
# Load fixture data
python manage.py loaddata fixtures/initial_data.json

# Create custom management command for seeding
python manage.py seed_initial_data
```

## Logging Configuration

Logs are configured in two files:

### Django Application Log
- **File:** `logs/django.log`
- **Level:** INFO in production, DEBUG in development
- **Format:** Verbose with timestamp, module, process, and thread info
- **Rotation:** 15MB per file, 10 backups

### Audit Log
- **File:** `logs/audit.log`
- **Level:** INFO
- **Format:** Verbose
- **Rotation:** 15MB per file, 10 backups
- **Usage:** All audit trail events are logged here

Access logs through:
```python
import logging

# Application logger
logger = logging.getLogger('django')
logger.info('Application event')

# Audit logger
audit_logger = logging.getLogger('audit')
audit_logger.info('Audit event')
```

## Security Considerations

### Development vs. Production

**Development:**
- `DEBUG = True` enables detailed error pages
- Insecure SECRET_KEY for convenience
- SessionAuthentication enabled for manual testing
- HTTPS redirects disabled

**Production:**
- `DEBUG = False` - prevents information disclosure
- Secure SECRET_KEY required (generate new one)
- HTTPS enforced
- HSTS enabled (31536000 seconds = 1 year)
- X-Frame-Options: DENY
- XSS protection headers
- CSP headers configured
- CSRF protection enabled
- Secure cookies (HTTPS only)

### Database Best Practices
```python
# Connection pooling (production)
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}
```

### Secret Key Generation
```bash
# Generate a secure key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Custom User Model

The backend uses a custom User model for flexibility:

```python
from accounts.models import User

# Create user
user = User.objects.create_user(
    email='user@example.com',
    password='password123',
    first_name='John',
    last_name='Doe',
    role=User.UserRole.STUDENT
)

# Update username lookup (None - not used)
print(user.USERNAME_FIELD)  # 'email'
```

## Management Commands

### Custom Commands to Implement
```python
# Run custom commands
python manage.py seed_courses
python manage.py generate_audit_report
python manage.py cleanup_expired_bans
python manage.py sync_federation_instances
```

## Testing

### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts

# Run with verbosity
python manage.py test accounts -v 2

# Run single test class
python manage.py test accounts.tests.UserModelTest
```

## Deployment

### Gunicorn + Nginx
```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  --log-level info
```

### Docker
```bash
# Build image
docker build -t openlearngrid-backend .

# Run container
docker run -p 8000:8000 \
  -e DJANGO_ENV=production \
  -e SECRET_KEY=your-key \
  openlearngrid-backend
```

### Database Backup
```bash
# PostgreSQL backup
pg_dump -U pguser openlearngrid > backup.sql

# Restore backup
psql -U pguser openlearngrid < backup.sql
```

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/)
- [django-storages](https://django-storages.readthedocs.io/)
- [django-cors-headers](https://github.com/adamchainz/django-cors-headers)
- [python-decouple](https://github.com/henriquebastos/python-decouple)

## License

This backend is part of Open Learn Grid and is licensed under the same terms as the main project.
