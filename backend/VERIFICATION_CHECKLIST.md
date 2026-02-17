# Quick Verification Checklist

Use this checklist to verify your Open Learn Grid backend setup is complete.

---

## Pre-Setup Verification

### Environment & Dependencies
- [ ] Python 3.10+ installed: `python --version`
- [ ] Virtual environment created and activated
- [ ] `pip` updated: `pip install --upgrade pip`
- [ ] All dependencies installed: `pip install -r requirements.txt`

**Check**: Run `pip list | grep -E \"Django|rest-framework|decouple\"`

---

## Project Structure

### Django Applications
- [ ] `accounts/` directory exists with models.py
- [ ] `academic/` directory exists with models.py
- [ ] `materials/` directory exists with models.py
- [ ] `federation/` directory exists with models.py
- [ ] `moderation/` directory exists with models.py
- [ ] `notifications/` directory exists with models.py
- [ ] `audit/` directory exists with models.py

**Check**: Run `ls -d */  | grep -v .venv | sort`

### Configuration Files
- [ ] `config/settings/__init__.py` exists
- [ ] `config/settings/base.py` exists
- [ ] `config/settings/local.py` exists
- [ ] `config/settings/production.py` exists
- [ ] `config/exceptions.py` exists
- [ ] `.env.example` exists

**Check**: Run `ls config/settings/*.py .env.example 2>/dev/null`

### Documentation Files
- [ ] `README.md` exists
- [ ] `SETUP_GUIDE.md` exists
- [ ] `ARCHITECTURE.md` exists
- [ ] `QUICKSTART.md` exists
- [ ] `VERIFICATION_CHECKLIST.md` exists (this file)

**Check**: Run `ls *.md 2>/dev/null | wc -l` (should be 6+)

---

## Configuration

### Environment Variables
- [ ] `.env.example` file contains all required variables
- [ ] `.env` file created from `.env.example`: `cp .env.example .env`
- [ ] `DJANGO_ENV=local` set in `.env` (for development)
- [ ] `SECRET_KEY` configured (defaults provided)
- [ ] Database settings configured (or using defaults)

**Check**: `cat .env | head -10`

### Django Settings
- [ ] Settings auto-load based on DJANGO_ENV
- [ ] Base settings include all required apps
- [ ] Development overrides working in local.py
- [ ] Production config prepared for deployment

**Check**: Run `python manage.py check`

---

## Database

### Configuration
- [ ] PostgreSQL connection configured (or defaults for SQLite)
- [ ] Database credentials in `.env`
- [ ] Database name configured

**Check**: Verify `.env` has database settings

### Models Ready
- [ ] All 7 apps have models.py files
- [ ] Custom User model in accounts
- [ ] Models include appropriate fields and relationships
- [ ] All models have proper Meta classes

**Check**: Run `python manage.py check`

---

## Django Framework

### Project Check
- [ ] `python manage.py check` passes: System check identified no issues
- [ ] All apps in INSTALLED_APPS
- [ ] Middleware properly configured
- [ ] SECRET_KEY defined

**Verify**:
```bash
python manage.py check
```

Should output: `System check identified no issues (0 silenced).`

### App Configuration
- [ ] accounts app configuration
- [ ] academic app configuration  
- [ ] materials app configuration
- [ ] federation app configuration
- [ ] moderation app configuration
- [ ] notifications app configuration
- [ ] audit app configuration

**Check**: Run `python manage.py check`

---

## Security

### Authentication
- [ ] JWT token-based auth configured
- [ ] Custom user model with email field
- [ ] Password validation rules set
- [ ] CSRF protection enabled

**Check**: Verify in `config/settings/base.py`

### CORS & CSRF
- [ ] CORS_ALLOWED_ORIGINS configured
- [ ] CSRF_TRUSTED_ORIGINS configured
- [ ] CORS middleware in place
- [ ] CSRF middleware in place

**Check**: Verify in `config/settings/base.py`

### Audit & Logging
- [ ] Logging configuration in place
- [ ] Audit logger separate from app logger
- [ ] Log levels appropriate
- [ ] Audit model defined

**Check**: Verify in `config/settings/base.py`

---

## File Storage

### Development Setup
- [ ] Local filesystem storage configured
- [ ] MEDIA_ROOT set
- [ ] MEDIA_URL set
- [ ] media/ directory exists or will be created

**Check**: Verify in `config/settings/base.py`

### Production Preparation
- [ ] S3 storage backend documented
- [ ] boto3 installed
- [ ] django-storages[s3] installed
- [ ] AWS configuration documented in .env.example

**Check**: Run `python -c \"import boto3; import storages\"`

---

## Documentation

### Setup Guides
- [ ] README.md includes quick start
- [ ] SETUP_GUIDE.md has step-by-step instructions
- [ ] QUICKSTART.md available for fast setup
- [ ] Environment variables documented

### Architecture
- [ ] ARCHITECTURE.md describes system design
- [ ] Data models documented
- [ ] API endpoints listed
- [ ] Security features listed

### Verification
- [ ] VERIFICATION_CHECKLIST.py available
- [ ] COMPLETION_SUMMARY.md available
- [ ] Troubleshooting guide included
- [ ] Common issues documented

---

## Ready to Run

### Start Development Server
- [ ] `python manage.py runserver` starts without errors
- [ ] Server responds to requests on `http://localhost:8000`
- [ ] Django admin available at `http://localhost:8000/admin/`

**Test**:
```bash
python manage.py runserver
# In another terminal:
curl http://localhost:8000/api/health/
```

### Next Steps Available
- [ ] Migrations ready to run
- [ ] Superuser creation documented
- [ ] API endpoints ready for implementation
- [ ] Tests ready to write

---

## Final Verification Command

Run this complete verification:

```bash
# 1. Check Django setup
python manage.py check

# 2. List installed packages
pip list | grep -E "Django|rest-framework|decouple|storages|boto3"

# 3. Verify project structure
ls -d accounts academic materials federation moderation notifications audit config

# 4. Check documentation
ls *.md

# 5. Verify settings
python -c "from django.conf import settings; print('Settings loaded:', settings.INSTALLED_APPS)"

# 6. Test imports
python -c "from accounts.models import User; from django.conf import settings; print('All imports successful')"
```

---

## 🎯 Success Indicators

When everything is working, you should see:

1. `python manage.py check` → No issues
2. All 7 apps directories present
3. Settings files in config/settings/
4. Documentation files present
5. `.env` file created and configured
6. Django imports successful
7. Models define properly
8. Development server starts

---

## Troubleshooting

### If `python manage.py check` fails
1. Verify virtual environment is activated
2. Verify all dependencies installed: `pip install -r requirements.txt`
3. Check `.env` file configuration
4. See VERIFICATION_CHECKLIST.py for detailed troubleshooting

### If imports fail
1. Ensure virtual environment is activated
2. Verify installed packages: `pip list`
3. Check PYTHONPATH: `python -c "import sys; print(sys.path)"`

### If database connection fails
1. Verify PostgreSQL is running (if using PostgreSQL)
2. Check `.env` database credentials
3. Test connection: `psql -U openlearngrid -d openlearngrid_dev`

---

## 📞 Support Resources

- **SETUP_GUIDE.md** - Detailed setup instructions
- **ARCHITECTURE.md** - System architecture
- **VERIFICATION_CHECKLIST.py** - Comprehensive verification
- **README.md** - Quick reference
- **COMPLETION_SUMMARY.md** - Implementation details

---

## You're Ready!

Once all checkboxes are complete, you're ready to:

1. Run migrations
2. Create superuser  
3. Implement API endpoints
4. Write tests
5. Deploy to production

---

**Status**: When all items are checked , your backend setup is complete!
