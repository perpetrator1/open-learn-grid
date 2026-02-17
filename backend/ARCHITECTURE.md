# Open Learn Grid - Django Backend Architecture

## System Overview

Open Learn Grid is a federated, open-source learning platform with a Django REST Framework backend and React frontend. The backend provides a scalable, multi-tenant API with comprehensive role-based access control, audit logging, and federation capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│                    (Port 5173, TypeScript)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/REST API
                    CORS Enabled
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Django REST Framework Backend                  │
│                    (Port 8000, Python)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Authentication & Authorization            │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  JWT Token-based Authentication                 │ │   │
│  │  │  - Access tokens (short-lived)                  │ │   │
│  │  │  - Refresh tokens (long-lived)                  │ │   │
│  │  │  - Token validation & expiry                    │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  Role-Based Access Control (RBAC)               │ │   │
│  │  │  - User roles: Student, Instructor, Admin       │ │   │
│  │  │  - Custom roles with permissions                │ │   │
│  │  │  - Resource-level access control                │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Django Apps                        │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────────────┐ │   │
│  │  │ accounts │ │ academic  │ │    materials         │ │   │
│  │  │          │ │           │ │                      │ │   │
│  │  │ - Users  │ │ - Depts   │ │   - Notes            │ │   │
│  │  │ - Roles  │ │ - Courses │ │   - Question Papers  │ │   │
│  │  │ - Profiles │ - Subjects│ │   - Attachments      │ │   │
│  │  │ - Auth   │ │ - Terms   │ │   - Versioning       │ │   │
│  │  └──────────┘ └───────────┘ └──────────────────────┘ │   │
│  │  ┌──────────────────┐ ┌────────────────────────────┐ │   │
│  │  │   federation     │ │    moderation              │ │   │
│  │  │                  │ │  - Reports                 │ │   │
│  │  │ - Instance reg   │ │  - Bans                    │ │   │
│  │  │ - Cross-instance │ │  - Appeals                 │ │   │
│  │  │ - Security       │ │  - Rules                   │ │   │
│  │  │ - Discovery      │ │  - Moderation Actions      │ │   │
│  │  └──────────────────┘ └────────────────────────────┘ │   │
│  │  ┌──────────────────────┐ ┌──────────────────────┐   │   │
│  │  │  notifications       │ │      audit           │   │   │
│  │  │                      │ │                      │   │   │
│  │  │ - In-app messages    │ │ - Action logging     │   │   │
│  │  │ - Preferences        │ │ - User attribution   │   │   │
│  │  │ - Read/Unread        │ │ - Immutable trail    │   │   │
│  │  │ - Types              │ │ - Compliance         │   │   │
│  │  └──────────────────────┘ └──────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Data Access Layer                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐   │   │
│  │  │ Models  │  │Serializers│ │ViewSets/Views      │   │   │
│  │  │ (ORM)   │  │(DRF)     │ │(REST Endpoints)     │   │   │
│  │  └─────────┘  └─────────┘  └─────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Middleware & Services                     │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  - CORS Support                                 │ │   │
│  │  │  - Request Logging & Tracking                   │ │   │
│  │  │  - Exception Handling                           │ │   │
│  │  │  - Pagination & Filtering                       │ │   │
│  │  │  - Rate Limiting (optional)                     │ │   │
│  │  │  - Caching                                      │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            File Storage                              │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  Development: Local Filesystem Storage          │ │   │
│  │  │  Production: S3-Compatible Storage (AWS, MinIO) │ │   │
│  │  │  - Media files: Notes, PDFs, Images             │ │   │
│  │  │  - Profile pictures                             │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Logging & Monitoring                      │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  - Application Logs (Django)                    │ │   │
│  │  │  - Audit Logs (Immutable)                       │ │   │
│  │  │  - Access Logs                                  │ │   │
│  │  │  - Error Tracking                               │ │   │
│  │  │  - Performance Monitoring                       │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
    ┌───────────────────┐  ┌──────────────────────┐
    │   PostgreSQL DB   │  │  S3-Compatible       │
    │   (Main Database) │  │  Storage for Assets  │
    │                   │  │                      │
    │ - User Data       │  │ - Media Files        │
    │ - Content         │  │ - Static Files       │
    │ - Audit Trail     │  │ - Backups            │
    │ - Logs            │  │                      │
    └───────────────────┘  └──────────────────────┘
```

## Directory Structure

```
backend/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py          # Settings loader
│   │   ├── base.py              # Common settings
│   │   ├── local.py             # Development overrides
│   │   └── production.py         # Production overrides
│   ├── urls.py                  # URL routing
│   ├── wsgi.py                  # WSGI application
│   ├── asgi.py                  # ASGI application
│   └── exceptions.py            # Custom exception handlers
│
├── accounts/
│   ├── models.py                # User, UserProfile, Role models
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin site configuration
│   ├── urls.py                  # App-specific URLs
│   └── apps.py                  # App configuration
│
├── academic/
│   ├── models.py                # Department, Semester, Course, Subject
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin configuration
│   ├── urls.py                  # App URLs
│   └── apps.py                  # App configuration
│
├── materials/
│   ├── models.py                # Material, Note, QuestionPaper
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin configuration
│   ├── urls.py                  # App URLs
│   └── apps.py                  # App configuration
│
├── federation/
│   ├── models.py                # Instance, InstanceEndpoint
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin configuration
│   ├── urls.py                  # App URLs
│   └── apps.py                  # App configuration
│
├── moderation/
│   ├── models.py                # Report, Ban, Appeal
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin configuration
│   ├── urls.py                  # App URLs
│   └── apps.py                  # App configuration
│
├── notifications/
│   ├── models.py                # Notification model
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin configuration
│   ├── urls.py                  # App URLs
│   └── apps.py                  # App configuration
│
├── audit/
│   ├── models.py                # AuditLog model
│   ├── views.py                 # API views
│   ├── serializers.py           # DRF serializers
│   ├── admin.py                 # Admin configuration
│   ├── urls.py                  # App URLs
│   └── apps.py                  # App configuration
│
├── manage.py                    # Django management command
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
│
├── SETUP_GUIDE.md               # Setup and configuration guide
├── ARCHITECTURE.md              # This file
├── VERIFICATION_CHECKLIST.py    # Verification checklist
│
├── media/                       # User-uploaded files (dev)
├── logs/                        # Log files
└── staticfiles/                 # Collected static files (prod)
```

## Data Models

### accounts App

```
User (AbstractUser)
├── email (unique, primary identifier)
├── first_name, last_name
├── role (student/instructor/admin/moderator)
├── profile_picture (ImageField)
├── bio (TextField)
├── is_email_verified (boolean)
├── created_at, updated_at
└── permissions (inherited from AbstractUser)

UserProfile (1-to-1 with User)
├── user (OneToOneField)
├── institution
├── department
├── location
├── website
├── phone_number
├── social_links (JSONField)
├── preferences (JSONField)
└── updated_at

Role (custom roles with permissions)
├── name (unique)
├── description
├── permissions (JSONField: list of permission strings)
├── is_system_role (boolean)
├── created_at, updated_at
└── users (reverse relation)

UserRole (M2M through model)
├── user (ForeignKey to User)
├── role (ForeignKey to Role)
└── assigned_at
```

### academic App

```
Department
├── name
├── code (unique)
├── description
├── head_of_department (ForeignKey to User)
├── created_at, updated_at
└── courses (reverse relation)

Semester
├── year (academic year)
├── season (spring/fall/winter)
├── start_date
├── end_date
├── is_active (boolean)
├── created_at, updated_at
└── courses (reverse relation)

Course
├── title
├── code (unique per semester)
├── department (ForeignKey)
├── semester (ForeignKey)
├── instructor (ForeignKey to User)
├── description
├── credits
├── capacity
├── created_at, updated_at
└── subjects, enrollments (reverse relations)

Subject
├── title
├── course (ForeignKey)
├── description
├── order (display order)
├── created_at, updated_at
└── materials (reverse relation)
```

### materials App

```
Material (base class)
├── title
├── description
├── content_type (notes/question_paper/resource)
├── course (ForeignKey)
├── uploaded_by (ForeignKey to User)
├── created_at, updated_at
├── tags (JSONField or M2M)
├── is_published (boolean)
└── views_count

Note (extends Material)
├── material_ptr (OneToOneField to Material)
├── subject (ForeignKey, optional)
└── content (TextField or rich text)

QuestionPaper (extends Material)
├── material_ptr (OneToOneField to Material)
├── from_semester (ForeignKey to Semester)
├── difficulty_level (easy/medium/hard)
├── duration (in minutes)
└── total_marks

Attachment
├── material (ForeignKey)
├── file (FileField)
├── file_type
├── uploaded_at
└── downloads_count
```

### federation App

```
Instance
├── name
├── domain
├── public_key
├── is_verified (boolean)
├── is_trusted (boolean)
├── last_contacted_at
├── created_at, updated_at
└── endpoints (reverse relation)

InstanceEndpoint
├── instance (ForeignKey)
├── endpoint_type (api/webhook/discovery)
├── url
├── is_active (boolean)
├── last_status_code
├── last_checked_at
├── created_at, updated_at
└── shared_secret (encrypted)
```

### moderation App

```
Report
├── reporter (ForeignKey to User)
├── content_type (GenericForeignKey)
├── object_id
├── description
├── status (pending/reviewing/resolved)
├── created_at, reviewed_at
└── moderator (ForeignKey to User, nullable)

Ban
├── user (ForeignKey)
├── reason
├── banned_by (ForeignKey to User)
├── start_date
├── end_date (nullable for permanent)
├── appeal (reverse relation)
├── created_at, updated_at
└── is_active (boolean)

Appeal
├── ban (ForeignKey)
├── appellant (ForeignKey to User)
├── reason
├── status (pending/approved/denied)
├── reviewed_by (ForeignKey to User, nullable)
├── appeal_decision
├── created_at, reviewed_at
└── updated_at
```

### notifications App

```
Notification
├── user (ForeignKey)
├── title
├── message
├── notification_type (system/user/digest)
├── related_object_type (GenericForeignKey, nullable)
├── is_read (boolean)
├── created_at
├── read_at (nullable)
└── expires_at (nullable)
```

### audit App

```
AuditLog
├── user (ForeignKey to User, nullable)
├── action (str: create/update/delete/view)
├── resource_type (str: model name)
├── resource_id (int or uuid)
├── changes (JSONField: {old_value, new_value})
├── ip_address
├── user_agent
├── created_at
└── metadata (JSONField, optional)
```

## API Endpoints Overview

### Authentication
- `POST /api/token/` - Obtain JWT tokens
- `POST /api/token/refresh/` - Refresh access token

### Accounts
- `GET/POST /api/users/` - List/create users
- `GET/PUT/DELETE /api/users/{id}/` - User detail operations
- `GET/PUT /api/users/profile/` - User profile

### Academic
- `GET/POST /api/departments/` - Department listing/creation
- `GET/POST /api/semesters/` - Semester listing/creation
- `GET/POST /api/courses/` - Course listing/creation
- `GET/POST /api/subjects/` - Subject listing/creation

### Materials
- `GET/POST /api/materials/` - Materials listing/creation
- `GET/PUT/DELETE /api/materials/{id}/` - Material detail operations
- `POST /api/materials/{id}/upload/` - File upload

### Federation
- `GET /api/instances/` - List federated instances
- `POST /api/instances/register/` - Register new instance
- `GET /api/instances/{id}/status/` - Check instance status

### Moderation
- `GET/POST /api/reports/` - List/create reports
- `GET/POST /api/bans/` - List/create bans
- `GET/POST /api/appeals/` - List/create appeals

### Notifications
- `GET /api/notifications/` - List notifications
- `PUT /api/notifications/{id}/read/` - Mark as read

### Audit
- `GET /api/audit-logs/` - List audit logs (admin only)

## Security Considerations

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Token refresh mechanism
- Secure password hashing (PBKDF2)

### Data Protection
- Input validation on all endpoints
- Output sanitization to prevent XSS
- CSRF protection for state-changing requests
- SQL injection prevention (ORM)
- Rate limiting (future enhancement)

### Communication
- HTTPS/TLS in production
- CORS configuration
- Secure headers (CSP, X-Frame-Options, etc.)
- HSTS for HTTPS enforcement

### Audit & Compliance
- Immutable audit logs
- User action tracking
- Data access logging
- Compliance with regulations

## Scalability Considerations

### Database
- PostgreSQL for ACID compliance
- Connection pooling for efficiency
- Database indexes on frequently queried fields
- Prepared statements to prevent SQL injection

### Caching
- Redis for session and cache storage (optional)
- Cache invalidation strategy
- Rate limiting and throttling

### File Storage
- S3-compatible storage for production
- CDN for static file delivery (optional)
- Local filesystem for development

### Asynchronous Tasks
- Celery for background jobs (future)
- Task queue for email, notifications
- Scheduled tasks for cleanup

## Development Workflow

```
1. Create/Modify Models
   ↓
2. Create/Update Migrations
   ↓
3. Create Serializers
   ↓
4. Create ViewSets
   ↓
5. Register URLs
   ↓
6. Write Tests
   ↓
7. Document API Endpoints
   ↓
8. Deploy
```

## Deployment Strategy

### Development
- Single server with debug enabled
- SQLite or local PostgreSQL
- Local filesystem storage
- Console email backend

### Staging
- Docker container deployment
- PostgreSQL database
- Local filesystem storage (for testing)
- SMTP email backend
- SSL/TLS enabled

### Production
- Docker/Kubernetes deployment
- PostgreSQL with backups
- S3-compatible storage
- SMTP email backend
- SSL/TLS with certificate
- Monitoring and logging
- Rate limiting
- Load balancing

## Future Enhancements

1. **Real-time Features**
   - WebSocket support for live notifications
   - Real-time collaboration on materials

2. **Advanced Search**
   - Elasticsearch integration
   - Full-text search capabilities

3. **Analytics**
   - User engagement metrics
   - Material usage statistics
   - Learning analytics

4. **AI/ML Integration**
   - Personalized recommendations
   - Content classification
   - Plagiarism detection

5. **Mobile App**
   - Native mobile applications
   - Offline content access

6. **Advanced Federation**
   - Cross-instance content sharing
   - Federated search
   - Instance-to-instance communication
