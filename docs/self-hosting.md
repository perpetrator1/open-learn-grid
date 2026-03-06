# Self-Hosting Open Learn Grid

## Prerequisites

- Docker & Docker Compose (v2.x)
- A domain name pointing to your server (e.g., `learngrid.yourschool.edu`)
- An SMTP server for email delivery (optional but recommended)
- At least 2 GB RAM, 20 GB disk

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourorg/open-learn-grid.git
cd open-learn-grid
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
# Django
SECRET_KEY=<generate with: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=learngrid.yourschool.edu

# Database
POSTGRES_DB=openlearngrid
POSTGRES_USER=olg
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgres://olg:<strong-password>@db:5432/openlearngrid

# Redis / Celery
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0

# Email
EMAIL_HOST=smtp.yourschool.edu
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@yourschool.edu
EMAIL_HOST_PASSWORD=<smtp-password>
DEFAULT_FROM_EMAIL=noreply@yourschool.edu

# Federation
INSTANCE_DOMAIN=learngrid.yourschool.edu
INSTANCE_NAME=Your School Open Learn Grid
INSTANCE_PRIVATE_KEY=<paste RSA private key here — see step 5>

# Media
MEDIA_URL=https://learngrid.yourschool.edu/media/
```

### 3. Start the services

```bash
docker compose up -d
```

This starts: `db` (PostgreSQL), `redis`, `backend` (Django + Gunicorn), `worker` (Celery), `beat` (Celery Beat), `frontend` (Nginx serving Vite build).

### 4. Run migrations

```bash
docker compose exec backend python manage.py migrate
```

### 5. Generate your instance RSA key pair

```bash
docker compose exec backend python manage.py generate_keypair --save
```

This prints both keys. **Copy the private key** and paste it into `.env` as `INSTANCE_PRIVATE_KEY`. Restart the backend:

```bash
docker compose restart backend
```

### 6. Create your superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

### 7. Run the setup wizard (optional)

Visit `https://learngrid.yourschool.edu/setup` in your browser to complete instance configuration via the web UI. Or skip this and configure via the Django admin at `/admin/`.

---

## Connecting to the Federation

### Add a trusted instance

1. Log in as an admin.
2. Go to **Federation** in the nav bar.
3. Click **Add Instance**, enter the domain (e.g., `learngrid.otheruni.edu`).
4. Click **Fetch Info** to verify the instance is reachable.
5. Set trust level to **Trusted** and save.

The instance's materials will appear in the **Federated Network** tab of the Browse page.

### Advertise your instance

Share your domain with other instance admins. Your well-known endpoint is:

```
https://learngrid.yourschool.edu/.well-known/openlearngrid/instance
```

---

## Celery Beat Tasks

These run automatically once `beat` container is running. Configure intervals in Django admin under **Periodic Tasks**.

| Task | Default interval |
|------|-----------------|
| `health_check_instances` | Every 15 minutes |
| `send_instance_stats` | Every 6 hours |
| `cleanup_old_activities` | Daily |

---

## Upgrading

```bash
git pull
docker compose build
docker compose up -d
docker compose exec backend python manage.py migrate
```

---

## Backup

Back up the PostgreSQL database and the `media/` volume:

```bash
docker compose exec db pg_dump -U olg openlearngrid > backup.sql
docker cp open-learn-grid-backend-1:/app/media ./media-backup
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | Django secret key |
| `DEBUG` | | Set `False` in production |
| `ALLOWED_HOSTS` | ✅ | Comma-separated hostnames |
| `DATABASE_URL` | ✅ | PostgreSQL connection URL |
| `REDIS_URL` | ✅ | Redis connection URL |
| `INSTANCE_DOMAIN` | ✅ | Your instance's public domain |
| `INSTANCE_NAME` | | Display name for your instance |
| `INSTANCE_PRIVATE_KEY` | ✅ | RSA private key (PEM, no newlines or keep as multiline) |
| `EMAIL_HOST` | | SMTP host for email delivery |
