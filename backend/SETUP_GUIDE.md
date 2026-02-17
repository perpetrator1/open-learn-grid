# Open Learn Grid - Django Backend Setup Guide

## Quick Start

### 1. Environment Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
# Start the development server
python manage.py runserver

# Server will be available at http://localhost:8000
# Admin interface at http://localhost:8000/admin/
```

## Environment Variables

### Development (.env file)

```env
DJANGO_ENV=local
SECRET_KEY=django-insecure-your-development-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

POSTGRES_DB=openlearngrid_dev
POSTGRES_USER=openlearngrid
POSTGRES_PASSWORD=securepassword
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Production (.env file)

```env
DJANGO_ENV=production
SECRET_KEY=your-super-secret-production-key-change-this
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

POSTGRES_DB=openlearngrid_prod
POSTGRES_USER=dbuser
POSTGRES_PASSWORD=very-secure-password
POSTGRES_HOST=db.example.com
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

USE_S3=True
AWS_STORAGE_BUCKET_NAME=openlearngrid-uploads
AWS_S3_REGION_NAME=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@openlearngrid.com
```

## Django Apps Overview

### accounts
**Purpose**: User authentication, profiles, and role management

**Models**:
- `User` - Custom user model with email-based authentication
- `UserProfile` - Extended user profile information
- `Role` - Custom role definitions with permissions
- `UserRole` - Bridge model for user-role associations

**Key Features**:
- Email-based authentication (no username)
- Role-based access control
- User profile with social links and preferences
- Support for different user types (student, instructor, admin, moderator)

### academic
**Purpose**: Academic structure management (departments, courses, subjects, semesters)

**Models**:
- `Department` - Academic departments
- `Semester` - Academic semesters/terms
- `Course` - Individual courses
- `Subject` - Course subjects/topics

**Key Features**:
- Hierarchical academic structure
- Multiple courses per department
- Subject management within courses
- Semester-based course scheduling

### materials
**Purpose**: Educational materials management (notes, question papers, resources)

**Models**:
- `Material` - Base material model
- `Note` - Study notes and documents
- `QuestionPaper` - Question papers and exams
- `Attachment` - File attachments

**Key Features**:
- Multiple material types
- File upload support
- Version control for materials
- Access control and sharing

### federation
**Purpose**: Cross-instance communication and instance registry

**Models**:
- `Instance` - Registry of federated instances
- `InstanceEndpoint` - Communication endpoints
- `InstanceKey` - Shared secrets for secure communication

**Key Features**:
- Instance discovery and registry
- Secure cross-instance communication
- Instance verification and trust
- Federation protocol implementation

### moderation
**Purpose**: Content moderation, user bans, and appeals

**Models**:
- `Report` - User-submitted reports
- `Ban` - User bans and restrictions
- `Appeal` - Appeals for bans

**Key Features**:
- Content reporting system
- User ban management
- Appeal workflow
- Moderation actions logging

### notifications
**Purpose**: In-app notification system

**Models**:
- `Notification` - User notifications
- `NotificationPreference` - User notification preferences

**Key Features**:
- Real-time notifications
- Multiple notification types
- User notification preferences
- Read/unread status tracking

### audit
**Purpose**: Comprehensive audit logging of all significant actions

**Models**:
- `AuditLog` - Immutable audit trail

**Key Features**:
- System-wide audit trail
- Action tracking
- User attribution
- Immutable log records
- Compliance support

## Settings Organization

### Base Settings (base.py)
Contains all common settings shared between environments:
- Installed apps
- Middleware
- Database connection settings
- REST framework configuration
- CORS configuration
- Logging setup

### Development Settings (local.py)
Overrides for local development:
- Debug mode
- Extended JWT token lifetimes
- Console email backend
- Local file storage
- Verbose logging
- Extra development tools

### Production Settings (production.py)
Production-specific configurations:
- Security headers
- SSL/HTTPS enforcement
- S3 storage backend
- SMTP email configuration
- Optimized caching
- Restricted permissions

### Settings Loader (__init__.py)
Automatically loads appropriate settings based on `DJANGO_ENV` environment variable.

## File Storage

### Development
Files are stored locally in the `media/` directory:
```
backend/
├── media/
│   ├── profile_pictures/
│   ├── materials/
│   └── attachments/
```

### Production
Files are stored in S3-compatible storage:
- Media files: `s3://bucket-name/media/`
- Static files: `s3://bucket-name/static/`

Configure S3 credentials in `.env`:
```env
USE_S3=True
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_ENDPOINT_URL=https://s3.amazonaws.com
AWS_ACCESS_KEY_ID=YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET
```

## API Authentication

### JWT Token Flow

1. **Obtain Token**
   ```
   POST /api/token/
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   Returns:
   ```json
   {
     "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
   }
   ```

2. **Use Access Token**
   ```
   GET /api/resource/
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

3. **Refresh Token**
   ```
   POST /api/token/refresh/
   Content-Type: application/json
   
   {
     "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
   }
   ```

### Token Configuration

Development (extended lifetimes for testing):
- Access token: 1 hour
- Refresh token: 7 days

Production (shorter lifetimes for security):
- Access token: 5 minutes
- Refresh token: 1 day

## Common Commands

```bash
# Create migrations for model changes
python manage.py makemigrations [app_name]

# Apply migrations
python manage.py migrate [app_name]

# Create superuser
python manage.py createsuperuser

# Check project setup
python manage.py check

# Run development server
python manage.py runserver

# Collect static files (for production)
python manage.py collectstatic

# Create a shell with Django context
python manage.py shell

# Run tests
python manage.py test [app_name]

# Export data
python manage.py dumpdata [app_name] > backup.json

# Import data
python manage.py loaddata backup.json

# Create custom management commands
python manage.py generate_sample_data
```

## Troubleshooting

### Issue: "No module named 'decouple'"
**Solution**: Install python-decouple
```bash
pip install python-decouple
```

### Issue: "Could not connect to PostgreSQL"
**Solution**: Check database configuration
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Test connection: `psql -U openlearngrid -d openlearngrid`

### Issue: "ModuleNotFoundError: No module named 'django'"
**Solution**: Activate virtual environment and install dependencies
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### Issue: "CORS errors from frontend"
**Solution**: Verify CORS settings
1. Check `CORS_ALLOWED_ORIGINS` in settings
2. Ensure frontend URL is in the list
3. Restart development server

## Next Steps

1. **Create Serializers**: Define DRF serializers for each model
2. **Create ViewSets**: Implement API endpoints using ViewSets
3. **Setup Routers**: Configure URL routing for all endpoints
4. **Add Admin Interface**: Configure Django admin for each app
5. **Write Tests**: Create comprehensive test suites
6. **Setup CI/CD**: Configure automated testing and deployment
7. **Documentation**: Generate API documentation with DRF schema

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django REST Framework SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Storages](https://django-storages.readthedocs.io/)
- [python-decouple](https://github.com/henriquebastos/python-decouple)
