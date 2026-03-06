# Open Learn Grid

**Open Learn Grid** is a decentralized, self-hostable educational material management platform. It lets universities and educational institutions host their own instance, share verified academic resources with other trusted instances over a federated network, and maintain complete data sovereignty.

---

## Features

- **Material management** — upload, version, verify, and organise lecture notes, past papers, assignments, and more
- **Role-based access control** — admin, teacher, verifier, and student roles with fine-grained permissions
- **Federation** — securely share materials across independently-hosted instances with RSA-signed activities
- **Real-time notifications** — WebSocket-powered notification system with email fallback
- **Moderation** — reports, bans, appeals, and audit logging
- **Academic structure** — departments, courses, semesters, and subjects with cascading selects
- **Self-hostable** — one `docker compose up` for development, one `.env` for production

---

## Tech Stack

**Backend:** Django 5 · Django REST Framework · PostgreSQL · Redis · Celery · Django Channels (WebSockets) · SimpleJWT

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · React Router 6

**Infrastructure:** Docker · Nginx · Gunicorn + Uvicorn workers

---

## Quick Start (Docker Compose)

```bash
# Clone
git clone https://github.com/yourorg/open-learn-grid.git
cd open-learn-grid

# Configure
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY and POSTGRES_PASSWORD

# Start everything
docker compose up --build

# In a separate terminal, run migrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

# Open the app
open http://localhost:5173
```

---

## Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DEBUG=True, use local DB
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Production Deployment

See **[docs/self-hosting.md](docs/self-hosting.md)** for a complete production deployment guide including:
- Production Docker Compose setup
- SSL/TLS with Let's Encrypt
- Environment variable reference
- Backup and restore procedures

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Self-hosting](docs/self-hosting.md) | Docker deployment, SSL, backups |
| [Federation](docs/federation.md) | Connect instances, trust levels, protocol |
| [Federation Protocol](docs/federation-protocol.md) | Technical wire protocol spec |
| [API Reference](docs/api.md) | REST API overview and authentication |
| [Deploy on VPS](docs/deploy-vps.md) | Step-by-step VPS setup guide |
| [Contributing](docs/contributing.md) | Development workflow and guidelines |
| [Testing](docs/testing.md) | Running tests, coverage, E2E |

---

## API Endpoints (Summary)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health/` | Component health status |
| `POST` | `/api/token/` | Get JWT access + refresh tokens |
| `GET` | `/api/materials/` | Browse materials (paginated, filtered) |
| `POST` | `/api/materials/` | Upload a new material |
| `GET` | `/api/federation/instances/` | List federated instances |
| `POST` | `/api/federation/inbox/` | Receive federation inbox activity |
| `GET` | `/.well-known/openlearngrid/instance` | Instance discovery info |

Full API docs available at `/api/docs/` when `drf-spectacular` is installed.

---

## Making Changes

```bash
make help          # show all commands
make dev           # start dev stack
make migrate       # run migrations
make test          # run all tests
make lint          # lint backend + frontend
make backup        # backup production DB + media
```

---

## License

MIT — see [LICENSE](LICENSE)

- /api/token/refresh/
