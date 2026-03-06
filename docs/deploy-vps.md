# Deploying on a VPS (DigitalOcean / Hetzner / Linode)

This guide walks through deploying Open Learn Grid on a fresh Linux VPS.

## 1. Provision your server

**Minimum specs:** 2 vCPU, 4 GB RAM, 80 GB SSD  
**Recommended:** 4 vCPU, 8 GB RAM, 160 GB SSD

Use Ubuntu 24.04 LTS. Tested on DigitalOcean, Hetzner Cloud, Linode.

## 2. Initial Server Setup

```bash
# SSH in as root
ssh root@<your-server-ip>

# Create a non-root user
adduser olg
usermod -aG sudo olg

# Copy SSH key
rsync --archive --chown=olg:olg ~/.ssh /home/olg

# Harden SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Switch to new user
su - olg
```

## 3. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

## 4. Point your Domain

Add an **A record** in your DNS provider pointing `learngrid.yourdomain.com` to your server's IP. Allow 5–30 minutes for propagation.

Verify: `dig +short learngrid.yourdomain.com`

## 5. Clone and Configure

```bash
git clone https://github.com/yourorg/open-learn-grid.git /opt/openlearngrid
cd /opt/openlearngrid

cp .env.example .env
nano .env
```

Required values to set in `.env`:
```dotenv
SECRET_KEY=<generate with python -c "import secrets; print(secrets.token_urlsafe(50))">
POSTGRES_PASSWORD=<strong-random-password>
ALLOWED_HOSTS=learngrid.yourdomain.com
CORS_ALLOWED_ORIGINS=https://learngrid.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://learngrid.yourdomain.com
FRONTEND_URL=https://learngrid.yourdomain.com
INSTANCE_DOMAIN=learngrid.yourdomain.com
INSTANCE_NAME=Your University Open Learn Grid
```

## 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot

# Stop any service on port 80 first
docker compose -f docker-compose.prod.yml down

# Get certificate
sudo certbot certonly --standalone -d learngrid.yourdomain.com

# Copy certs to nginx ssl directory
sudo cp /etc/letsencrypt/live/learngrid.yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/learngrid.yourdomain.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/
```

**Auto-renewal:** Add to `/etc/crontab`:
```
0 3 * * * root certbot renew --quiet && cp /etc/letsencrypt/live/learngrid.yourdomain.com/*.pem /opt/openlearngrid/nginx/ssl/ && docker compose -f /opt/openlearngrid/docker-compose.prod.yml restart nginx
```

## 7. Generate Federation Keys

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py generate_keypair
```

Copy the private key output and add it to `.env` as `INSTANCE_PRIVATE_KEY`.

## 8. Build and Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 9. First-Time Setup

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create admin user
docker compose -f docker-compose.prod.yml exec backend python manage.py setup_instance

# (Optional) Load sample data for testing
docker compose -f docker-compose.prod.yml exec backend python manage.py create_sample_data
```

## 10. Verify

```bash
./scripts/health-check.sh https://learngrid.yourdomain.com
```

You should see all components green. Open `https://learngrid.yourdomain.com` in your browser.

---

## Updating

```bash
cd /opt/openlearngrid
make update
# or manually:
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml up -d
```

---

## Monitoring Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Just backend
docker compose -f docker-compose.prod.yml logs -f backend

# Celery worker
docker compose -f docker-compose.prod.yml logs -f celery_worker
```

---

## Backup

```bash
# Backup DB + media (stored in ./backups/)
make backup

# Or manually
docker compose -f docker-compose.prod.yml exec db pg_dump -U olg openlearngrid | gzip > backup.sql.gz
```

Set up automated daily backups with cron:
```
0 2 * * * cd /opt/openlearngrid && ./scripts/backup.sh >> /var/log/olg-backup.log 2>&1
```

---

## Fail2ban (Optional)

Protect SSH from brute force:

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```
