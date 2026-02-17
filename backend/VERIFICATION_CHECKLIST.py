"""
FINAL VERIFICATION CHECKLIST
Open Learn Grid Django Backend Setup

This checklist verifies that all components of the Django backend
are properly configured and functional.
"""

# ============================================================================
# PHASE 1: ENVIRONMENT & DEPENDENCIES
# ============================================================================

PRE_SETUP_CHECKS = [
    "[ ] Python 3.10+ installed (python --version)",
    "[ ] Virtual environment created (.venv)",
    "[ ] Virtual environment activated",
    "[ ] pip updated (pip install --upgrade pip)",
]

DEPENDENCY_CHECKS = [
    "[ ] Django==5.0.* installed",
    "[ ] djangorestframework installed",
    "[ ] djangorestframework-simplejwt installed",
    "[ ] django-cors-headers installed",
    "[ ] django-storages[s3] installed",
    "[ ] python-decouple installed",
    "[ ] psycopg[binary] installed",
    "[ ] boto3 installed",
    "[ ] Pillow installed",
]


# ============================================================================
# PHASE 2: PROJECT STRUCTURE
# ============================================================================

PROJECT_STRUCTURE_CHECKS = [
    "[ ] backend/ directory exists at project root",
    "[ ] config/ directory contains Django configuration",
    "[ ] config/settings/ directory contains settings modules",
    "[ ] config/settings/__init__.py exists",
    "[ ] config/settings/base.py exists",
    "[ ] config/settings/local.py exists",
    "[ ] config/settings/production.py exists",
    "[ ] All 7 apps created: accounts, academic, materials, federation, moderation, notifications, audit",
    "[ ] manage.py exists at backend/ root",
    "[ ] .env.example exists at backend/ root",
]


# ============================================================================
# PHASE 3: DJANGO APPS VERIFICATION
# ============================================================================

APP_STRUCTURE_CHECKS = {
    "accounts": [
        "[ ] accounts/models.py contains User, UserProfile, Role, UserRole models",
        "[ ] accounts/admin.py configured",
        "[ ] accounts/views.py exists",
        "[ ] accounts/serializers.py exists",
        "[ ] accounts/urls.py exists",
        "[ ] accounts/apps.py configured",
    ],
    "academic": [
        "[ ] academic/models.py contains Department, Semester, Course, Subject models",
        "[ ] academic/admin.py configured",
        "[ ] academic/views.py exists",
        "[ ] academic/serializers.py exists",
        "[ ] academic/urls.py exists",
        "[ ] academic/apps.py configured",
    ],
    "materials": [
        "[ ] materials/models.py contains Material, Note, QuestionPaper models",
        "[ ] materials/admin.py configured",
        "[ ] materials/views.py exists",
        "[ ] materials/serializers.py exists",
        "[ ] materials/urls.py exists",
        "[ ] materials/apps.py configured",
    ],
    "federation": [
        "[ ] federation/models.py contains Instance, InstanceEndpoint models",
        "[ ] federation/admin.py configured",
        "[ ] federation/views.py exists",
        "[ ] federation/serializers.py exists",
        "[ ] federation/urls.py exists",
        "[ ] federation/apps.py configured",
    ],
    "moderation": [
        "[ ] moderation/models.py contains Report, Ban, Appeal models",
        "[ ] moderation/admin.py configured",
        "[ ] moderation/views.py exists",
        "[ ] moderation/serializers.py exists",
        "[ ] moderation/urls.py exists",
        "[ ] moderation/apps.py configured",
    ],
    "notifications": [
        "[ ] notifications/models.py contains Notification model",
        "[ ] notifications/admin.py configured",
        "[ ] notifications/views.py exists",
        "[ ] notifications/serializers.py exists",
        "[ ] notifications/urls.py exists",
        "[ ] notifications/apps.py configured",
    ],
    "audit": [
        "[ ] audit/models.py contains AuditLog model",
        "[ ] audit/admin.py configured",
        "[ ] audit/views.py exists",
        "[ ] audit/serializers.py exists",
        "[ ] audit/urls.py exists",
        "[ ] audit/apps.py configured",
    ],
}


# ============================================================================
# PHASE 4: SETTINGS CONFIGURATION
# ============================================================================

SETTINGS_CHECKS = {
    "base.py": [
        "[ ] INSTALLED_APPS includes all 7 custom apps",
        "[ ] INSTALLED_APPS includes django-storages",
        "[ ] MIDDLEWARE includes corsheaders",
        "[ ] DATABASES configured for PostgreSQL",
        "[ ] AUTH_USER_MODEL set to 'accounts.User'",
        "[ ] REST_FRAMEWORK configured with JWT authentication",
        "[ ] SIMPLE_JWT configured",
        "[ ] LOGGING configuration includes audit logger",
        "[ ] CORS_ALLOWED_ORIGINS uses environment variables",
        "[ ] File storage defaults to local filesystem",
    ],
    "local.py": [
        "[ ] SECRET_KEY loads from environment or uses default",
        "[ ] DEBUG set to True for development",
        "[ ] ALLOWED_HOSTS includes localhost and 127.0.0.1",
        "[ ] DATABASE overridable via environment variables",
        "[ ] EMAIL_BACKEND set to console backend",
        "[ ] DRF allows unauthenticated read access",
        "[ ] CORS_ALLOWED_ORIGINS includes dev ports (5173, 3000)",
        "[ ] JWT token lifetimes extended for development",
    ],
    "production.py": [
        "[ ] SECRET_KEY required from environment",
        "[ ] DEBUG set to False",
        "[ ] ALLOWED_HOSTS required from environment",
        "[ ] SSL/HTTPS redirect configured",
        "[ ] Security headers configured",
        "[ ] S3 storage backend configured for media and static files",
        "[ ] Email backend configured for SMTP",
        "[ ] HSTS enabled",
        "[ ] X-Frame-Options set to DENY",
    ],
    "__init__.py": [
        "[ ] Loads appropriate settings based on DJANGO_ENV variable",
        "[ ] Defaults to 'local' environment if not specified",
        "[ ] Loads 'production' settings when DJANGO_ENV='production'",
    ],
}


# ============================================================================
# PHASE 5: ENVIRONMENT VARIABLES
# ============================================================================

ENV_CHECKS = [
    "[ ] .env.example file created with all required variables",
    "[ ] Development .env file created from .env.example",
    "[ ] DJANGO_ENV set appropriately (local or production)",
    "[ ] SECRET_KEY configured (development default provided)",
    "[ ] DATABASE credentials configured",
    "[ ] CORS/CSRF origins configured",
    "[ ] Email settings configured",
    "[ ] S3 settings documented (commented for production)",
    "[ ] .env file added to .gitignore",
]


# ============================================================================
# PHASE 6: MODELS VERIFICATION
# ============================================================================

MODELS_VERIFICATION = {
    "accounts.User": [
        "[ ] Extends AbstractUser",
        "[ ] Uses email as USERNAME_FIELD",
        "[ ] Custom UserManager implemented",
        "[ ] Profile picture field (ImageField)",
        "[ ] Role field with choices (student, instructor, admin, moderator)",
        "[ ] Email verification flag",
        "[ ] Timestamps (created_at, updated_at)",
        "[ ] Database indexes on email, role, created_at",
    ],
    "accounts.UserProfile": [
        "[ ] OneToOneField to User",
        "[ ] Institution and department fields",
        "[ ] Location and website fields",
        "[ ] Social links (JSONField)",
        "[ ] User preferences (JSONField)",
    ],
    "accounts.Role": [
        "[ ] Name field (unique)",
        "[ ] Description field",
        "[ ] Permissions (JSONField)",
        "[ ] is_system_role boolean",
    ],
    "academic models": [
        "[ ] Department model with name, code, description",
        "[ ] Semester model with academic year, start/end dates",
        "[ ] Course model with title, code, credits",
        "[ ] Subject model with curriculum data",
    ],
    "materials models": [
        "[ ] Material base model with title, description, file",
        "[ ] Note model extending Material",
        "[ ] QuestionPaper model extending Material",
        "[ ] Attachment support for different file types",
    ],
    "federation models": [
        "[ ] Instance model for registry of federated instances",
        "[ ] InstanceEndpoint model for communication endpoints",
        "[ ] Instance verification/trust mechanism",
    ],
    "moderation models": [
        "[ ] Report model for user-submitted reports",
        "[ ] Ban model for user bans",
        "[ ] Appeal model for ban appeals",
    ],
    "notifications models": [
        "[ ] Notification model with user, title, message, read flag",
        "[ ] Notification types (system, user, digest)",
    ],
    "audit models": [
        "[ ] AuditLog model with user, action, resource, timestamp",
        "[ ] Support for different action types",
        "[ ] Immutable audit trail",
    ],
}


# ============================================================================
# PHASE 7: DATABASE & MIGRATIONS
# ============================================================================

DATABASE_CHECKS = [
    "[ ] PostgreSQL database accessible",
    "[ ] Database credentials in .env file",
    "[ ] makemigrations completes without errors",
    "[ ] Initial migrations created for all apps",
    "[ ] migrate command completes successfully",
    "[ ] All models reflected in database",
    "[ ] superuser created successfully",
]


# ============================================================================
# PHASE 8: DJANGO ADMIN
# ============================================================================

ADMIN_CHECKS = [
    "[ ] Django admin accessible at /admin/",
    "[ ] All 7 apps listed in admin interface",
    "[ ] User model properly registered",
    "[ ] UserProfile model properly registered",
    "[ ] Role model properly registered",
    "[ ] Filters and search configured for each model",
    "[ ] Custom admin actions where needed",
]


# ============================================================================
# PHASE 9: REST API ENDPOINTS
# ============================================================================

API_ENDPOINTS_CHECKS = [
    "[ ] /api/health/ returns status",
    "[ ] /api/token/ returns JWT tokens",
    "[ ] /api/token/refresh/ refreshes tokens",
    "[ ] All app viewsets configured",
    "[ ] Serializers defined for each model",
    "[ ] Routers registered in urls.py",
    "[ ] Pagination working",
    "[ ] Filtering working",
    "[ ] Search working",
]


# ============================================================================
# PHASE 10: SECURITY & CORS
# ============================================================================

SECURITY_CHECKS = [
    "[ ] CORS headers properly configured",
    "[ ] CSRF protection enabled",
    "[ ] CSRF tokens working in forms",
    "[ ] Password validation rules applied",
    "[ ] JWT token validation working",
    "[ ] HTTPS redirect enabled (production)",
    "[ ] Security middleware in place",
    "[ ] No hardcoded secrets in code",
]


# ============================================================================
# PHASE 11: FILE STORAGE
# ============================================================================

STORAGE_CHECKS = [
    "[ ] Local filesystem storage configured for development",
    "[ ] MEDIA_ROOT and MEDIA_URL configured",
    "[ ] MEDIA_URL accessible in browser",
    "[ ] S3 storage documented for production",
    "[ ] Boto3/AWS credentials required for production",
    "[ ] File upload working locally",
]


# ============================================================================
# PHASE 12: LOGGING & MONITORING
# ============================================================================

LOGGING_CHECKS = [
    "[ ] Logging configured with console handler (dev)",
    "[ ] Logging configured with file handler (prod)",
    "[ ] Audit logger separate from application logger",
    "[ ] Logs directory created and writable",
    "[ ] Rotating file handler configured",
    "[ ] Log levels appropriate for environment",
]


# ============================================================================
# QUICK VERIFICATION COMMANDS
# ============================================================================

VERIFICATION_COMMANDS = """
Run these commands to verify the setup:

1. Check Python and virtual environment:
   python --version
   which python

2. Check installed dependencies:
   pip list | grep -E "Django|rest-framework|django-cors|django-storages|python-decouple"

3. Check project structure:
   find . -type d -name "__pycache__" -prune -o -type f -name "*.pyc" -prune -o -type d -name "accounts" -o -name "academic" -o -name "materials" | grep -v __pycache__

4. Test Django settings:
   python manage.py check

5. Create migrations:
   python manage.py makemigrations

6. Apply migrations:
   python manage.py migrate

7. Create superuser:
   python manage.py createsuperuser

8. Test development server:
   python manage.py runserver

9. Run tests (if available):
   python manage.py test

10. Check for import errors:
    python -c "from django.conf import settings; print('Settings loaded successfully')"
"""


# ============================================================================
# COMMON ISSUES & TROUBLESHOOTING
# ============================================================================

COMMON_ISSUES = """
ISSUE 1: "ModuleNotFoundError: No module named 'django'"
SOLUTION: 
  - Activate virtual environment: source .venv/bin/activate (Linux/Mac)
  - Install dependencies: pip install -r requirements.txt

ISSUE 2: "SECRET_KEY not found in environment"
SOLUTION:
  - Copy .env.example to .env
  - Add SECRET_KEY to .env file
  - Or use development default

ISSUE 3: "Could not connect to PostgreSQL"
SOLUTION:
  - Check PostgreSQL service is running
  - Verify connection settings in .env
  - Test with: psql -U openlearngrid -d openlearngrid -h localhost

ISSUE 4: "makemigrations fails"
SOLUTION:
  - Check model syntax
  - Ensure AUTH_USER_MODEL = 'accounts.User' is set
  - Clear __pycache__ directories: find . -type d -name "__pycache__" -exec rm -r {} +

ISSUE 5: "CORS errors in frontend"
SOLUTION:
  - Check CORS_ALLOWED_ORIGINS in settings
  - Verify CORS_ALLOW_CREDENTIALS is True
  - Check frontend URL matches allowed origins

ISSUE 6: "S3 storage errors in production"
SOLUTION:
  - Verify AWS credentials in .env
  - Check bucket name and region
  - Verify AWS IAM permissions
  - Test with: python manage.py collectstatic --noop

ISSUE 7: "Static files not loading"
SOLUTION:
  - Run: python manage.py collectstatic
  - Check STATIC_URL and STATIC_ROOT settings
  - Verify web server configuration (nginx/Apache)
"""


# ============================================================================
# FINAL SIGN-OFF
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("OPEN LEARN GRID - DJANGO BACKEND VERIFICATION CHECKLIST")
    print("=" * 80)
    print()
    print("Instructions:")
    print("1. Go through each phase systematically")
    print("2. Check off items as you verify them")
    print("3. Run commands in PHASE 8 to verify database setup")
    print("4. Address any issues listed in COMMON ISSUES & TROUBLESHOOTING")
    print("5. Document any additional configuration needed")
    print()
    print("For detailed information, see:")
    print("- SETUP.md - Detailed setup instructions")
    print("- ARCHITECTURE.md - System architecture overview")
    print("- README.md - Project documentation")
    print()
    print("=" * 80)
