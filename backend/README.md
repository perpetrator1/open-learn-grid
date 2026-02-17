# Open Learn Grid - Django Backend

A comprehensive, federated, open-source learning management system backend built with Django REST Framework.

# Open Learn Grid Backend - Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env

# Edit .env - for local dev, just set:
DJANGO_ENV=local
SECRET_KEY=django-insecure-your-dev-key-here
POSTGRES_DB=openlearngrid_dev
```

### 3. Setup Database
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 4. Run Server
```bash
python manage.py runserver
```

Visit: http://localhost:8000/api/health/

## Project Structure Quick Reference

```
apps/
├── accounts/       → User auth, profiles, roles
├── academic/       → Departments, courses, subjects
├── materials/      → Study notes, exam papers
├── federation/     → Cross-instance sync
├── moderation/     → Reports, bans, appeals
├── notifications/  → In-app notifications
└── audit/         → Audit logging

config/
├── settings/base.py        → Shared config
├── settings/local.py       → Dev config
└── settings/production.py  → Prod config
```

## 🔨 Common Commands

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Run development server
python manage.py runserver

# Database reset (be careful!)
python manage.py flush
```

## Authentication

### Get Access Token
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

### Use Token in Requests
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/resource/
```

## 🗄️ Environment Variables

**Development (.env):**
```
DJANGO_ENV=local
DEBUG=True
SECRET_KEY=insecure-dev-key
POSTGRES_DB=openlearngrid_dev
POSTGRES_HOST=localhost
```

**Production (.env):**
```
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=your-secure-key
POSTGRES_DB=openlearngrid
POSTGRES_HOST=prod-db.example.com
USE_S3=True
AWS_STORAGE_BUCKET_NAME=your-bucket
```

## File Storage

**Development:** Local filesystem (`media/` folder)  
**Production:** AWS S3 (configure in `.env`)

## Models Overview

| App | Main Models |
|-----|-------------|
| accounts | User, UserProfile, Role |
| academic | Department, Semester, Subject, Course |
| materials | CourseMaterial, QuestionPaper, Note |
| federation | FederatedInstance, FederationMessage |
| moderation | Report, Ban, Appeal |
| notifications | Notification, NotificationTemplate, NotificationPreference |
| audit | AuditLog, AuditAction, AuditViewer |

## Read More

- [Full Setup Guide](./BACKEND_SETUP.md) - Comprehensive documentation
- [Django Docs](https://docs.djangoproject.com/) - Django framework
- [DRF Docs](https://www.django-rest-framework.org/) - REST API

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'django'` | Run `pip install -r requirements.txt` |
| `django.core.exceptions.ImproperlyConfigured` | Check `SECRET_KEY` in `.env` |
| Database connection error | Verify PostgreSQL is running and `.env` settings are correct |
| Port 8000 already in use | Run `python manage.py runserver 8001` |

## 🔗 Useful URLs (Local)

- Admin Panel: http://localhost:8000/admin/
- API Health: http://localhost:8000/api/health/
- Token Endpoint: http://localhost:8000/api/token/
- Token Refresh: http://localhost:8000/api/token/refresh/

---

**Need help?** Check [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed documentation.

## Documentation

### Getting Started
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup and configuration

### Architecture & Design
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data models
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Backend structure and components

### Verification
- **[VERIFICATION_CHECKLIST.py](VERIFICATION_CHECKLIST.py)** - Comprehensive verification checklist

## Core Components

### 7 Django Apps

| App | Purpose | Key Models |
|-----|---------|-----------|
| **accounts** | User auth, profiles, roles | User, UserProfile, Role, UserRole |
| **academic** | Academic structure | Department, Semester, Course, Subject |
| **materials** | Educational materials | Material, Note, QuestionPaper, Attachment |
| **federation** | Cross-instance communication | Instance, InstanceEndpoint |
| **moderation** | Content moderation | Report, Ban, Appeal |
| **notifications** | In-app notifications | Notification, NotificationPreference |
| **audit** | Action audit logging | AuditLog |

## ⚙️ Configuration

### Environment Variables

Development (defaults work):
```env
DJANGO_ENV=local
SECRET_KEY=django-insecure-development-key
DEBUG=True
```

Production require:
```env
DJANGO_ENV=production
SECRET_KEY=your-super-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
```

See [.env.example](.env.example) for complete reference.

### Settings Structure

```
config/settings/
├── __init__.py          # Auto-loads local or production settings
├── base.py              # Shared settings
├── local.py             # Development overrides
└── production.py        # Production overrides
```

**Environment Variable**: `DJANGO_ENV`
- Set to `local` (default) for development
- Set to `production` for production deployment

## Authentication

### JWT Token-Based Auth

1. **Obtain Token**
   ```bash
   curl -X POST http://localhost:8000/api/token/ \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

2. **Use Token**
   ```bash
   curl -H "Authorization: Bearer token_here" \
     http://localhost:8000/api/endpoint/
   ```

3. **Refresh Token**
   ```bash
   curl -X POST http://localhost:8000/api/token/refresh/ \
     -d '{"refresh":"refresh_token_here"}'
   ```

## File Storage

### Development
- Local filesystem storage
- Files stored in `media/` directory
- Perfect for local development and testing

### Production
- S3-compatible storage (AWS S3, MinIO, etc.)
- Configure via environment variables:
  ```env
  USE_S3=True
  AWS_STORAGE_BUCKET_NAME=your-bucket
  AWS_S3_REGION_NAME=us-east-1
  AWS_ACCESS_KEY_ID=your-access-key
  AWS_SECRET_ACCESS_KEY=your-secret
  ```

## Common Commands

```bash
# Check project setup
python manage.py check

# Create new migrations
python manage.py makemigrations [app_name]

# Apply migrations
python manage.py migrate [app_name]

# Run development server
python manage.py runserver

# Django shell (with Django context)
python manage.py shell

# Run tests
python manage.py test [app_name]

# Create admin user
python manage.py createsuperuser

# Collect static files (production)
python manage.py collectstatic

# View all available management commands
python manage.py help
```

## Docker

### Build Image
```bash
docker build -t openlearngrid-backend .
```

### Run Container
```bash
docker run -p 8000:8000 \
  -e DJANGO_ENV=local \
  -e POSTGRES_HOST=db \
  openlearngrid-backend
```

## Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts

# Run with verbose output
python manage.py test --verbosity=2

# Run specific test class
python manage.py test accounts.tests.TestUserModel

# Generate coverage report
coverage run --source='.' manage.py test
coverage report
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'django'"
Ensure virtual environment is activated and dependencies installed:
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### "Could not connect to PostgreSQL"
Check database configuration in `.env`:
```bash
# Test connection
psql -U openlearngrid -d openlearngrid_dev -h localhost
```

### "CORS errors from frontend"
Verify `CORS_ALLOWED_ORIGINS` in settings and ensure it matches your frontend URL.

See [VERIFICATION_CHECKLIST.py](VERIFICATION_CHECKLIST.py) for more troubleshooting.

## Deployment

### Development
```bash
python manage.py runserver
```

### Production with Gunicorn
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Docker Compose
```bash
docker-compose up backend
```

## API Documentation

### Health Check
```
GET /api/health/
```

### Authentication
```
POST /api/token/              # Get tokens
POST /api/token/refresh/      # Refresh access token
```

### Accounts Endpoints
- `GET/POST /api/users/` - User listing/creation
- `GET/PUT /api/users/{id}/` - User details
- `GET/PUT /api/profile/` - Current user profile

### Academic Endpoints
- `GET/POST /api/departments/`
- `GET/POST /api/semesters/`
- `GET/POST /api/courses/`
- `GET/POST /api/subjects/`

### Materials Endpoints
- `GET/POST /api/materials/`
- `GET/PUT/DELETE /api/materials/{id}/`

### Additional Endpoints
Check [ARCHITECTURE.md](ARCHITECTURE.md) for complete API documentation.

## Security Features

JWT token-based authentication
Role-based access control (RBAC)
CSRF protection
CORS configuration
SQL injection prevention (Django ORM)
XSS protection
HTTPS/SSL configuration (production)
Secure password hashing (PBKDF2)
Audit logging of all actions
Security headers (production)

## Database

### PostgreSQL
Primary database for all data:
- User data and authentication
- Content and materials
- Academic structure
- Audit logs
- Federation registry

### Connection String
```
postgresql://user:password@localhost:5432/openlearngrid
```

## Project Roadmap

### Phase 1 (Current)
Django apps structure
Settings configuration
Database models
API scaffolding

### Phase 2
- [ ] Complete serializers
- [ ] ViewSet implementations
- [ ] API endpoint testing
- [ ] Admin customization

### Phase 3
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced search (Elasticsearch)
- [ ] Caching strategy (Redis)
- [ ] Performance optimization

### Phase 4
- [ ] Analytics dashboard
- [ ] AI/ML integration
- [ ] Mobile app API
- [ ] Advanced reporting

## License

See [LICENSE](../LICENSE) for details.


## Next Steps

1. **Setup Development Environment**
   - Follow [QUICKSTART.md](QUICKSTART.md)

2. **Understand the Architecture**
   - Read [ARCHITECTURE.md](ARCHITECTURE.md)

3. **Implement API Endpoints**
   - Create serializers for each model
   - Implement ViewSets
   - Register URLs

4. **Write Tests**
   - Unit tests for models
   - Integration tests for APIs
   - End-to-end tests

5. **Deploy**
   - Setup production database
   - Configure S3 storage
   - Deploy with Docker/Kubernetes

---

**Status**: Backend structure complete and ready for development

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
