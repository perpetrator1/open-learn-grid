# ══════════════════════════════════════════════════════════
#  Open Learn Grid — Makefile
# ══════════════════════════════════════════════════════════
#
#  Dev:        make dev
#  Production: make prod
#  Tests:      make test
#  DB:         make migrate
# ══════════════════════════════════════════════════════════

.PHONY: help dev prod build migrate makemigrations createsuperuser \
        test test-backend test-frontend lint format shell logs \
        backup restore clean setup-instance generate-keys

COMPOSE        := docker compose
COMPOSE_PROD   := docker compose -f docker-compose.prod.yml
BACKEND        := $(COMPOSE) exec backend
BACKEND_PROD   := $(COMPOSE_PROD) exec backend

# Default target
help: ## Show this help message
	@echo ""
	@echo "  Open Learn Grid"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ── Development ───────────────────────────────────────────
dev: ## Start development stack
	$(COMPOSE) up --build

dev-d: ## Start development stack (detached)
	$(COMPOSE) up -d --build

dev-down: ## Stop development stack
	$(COMPOSE) down

# ── Production ────────────────────────────────────────────
prod: ## Start production stack (detached)
	$(COMPOSE_PROD) up -d

prod-build: ## Build production images
	$(COMPOSE_PROD) build

prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

prod-logs: ## Follow production logs
	$(COMPOSE_PROD) logs -f

# ── Database ──────────────────────────────────────────────
migrate: ## Run Django migrations (dev)
	$(BACKEND) python manage.py migrate

migrate-prod: ## Run Django migrations (prod)
	$(BACKEND_PROD) python manage.py migrate

makemigrations: ## Create new migrations (dev)
	$(BACKEND) python manage.py makemigrations

createsuperuser: ## Create a superuser (dev)
	$(BACKEND) python manage.py createsuperuser

# ── First-time setup ──────────────────────────────────────
setup: ## Run the interactive instance setup wizard (prod)
	$(BACKEND_PROD) python manage.py setup_instance

generate-keys: ## Generate RSA key pair for federation (prod)
	$(BACKEND_PROD) python manage.py generate_keypair

setup-dev: ## Seed dev database with sample data
	$(BACKEND) python manage.py create_sample_data

# ── Static files ──────────────────────────────────────────
collectstatic: ## Collect static files (prod)
	$(BACKEND_PROD) python manage.py collectstatic --noinput

# ── Testing ───────────────────────────────────────────────
test: test-backend test-frontend ## Run all tests

test-backend: ## Run Django pytest suite
	$(COMPOSE) run --rm backend pytest -v --tb=short

test-frontend: ## Run frontend tests
	$(COMPOSE) run --rm frontend npm test -- --run

test-coverage: ## Run backend tests with coverage
	$(COMPOSE) run --rm backend pytest --cov=. --cov-report=html --cov-report=term-missing

# ── Code quality ──────────────────────────────────────────
lint: ## Lint backend (ruff) and frontend (eslint)
	$(COMPOSE) run --rm backend ruff check .
	$(COMPOSE) run --rm frontend npm run lint

format: ## Format backend and frontend code
	$(COMPOSE) run --rm backend ruff format .
	$(COMPOSE) run --rm frontend npm run format

typecheck: ## TypeScript type check
	$(COMPOSE) run --rm frontend ./node_modules/.bin/tsc --noEmit

# ── Logs ──────────────────────────────────────────────────
logs: ## Follow dev logs
	$(COMPOSE) logs -f

logs-backend: ## Follow backend logs
	$(COMPOSE) logs -f backend

logs-celery: ## Follow celery worker logs
	$(COMPOSE_PROD) logs -f celery_worker

# ── Backup & restore ──────────────────────────────────────
backup: ## Backup database and media (prod)
	./scripts/backup.sh

restore: ## Restore from backup (prod)
	./scripts/restore.sh $(file)

# ── Maintenance ───────────────────────────────────────────
health: ## Check application health
	./scripts/health-check.sh

clean: ## Remove stopped containers and dangling images
	$(COMPOSE) down --remove-orphans
	docker image prune -f

shell: ## Django management shell (dev)
	$(BACKEND) python manage.py shell

shell-prod: ## Django management shell (prod)
	$(BACKEND_PROD) python manage.py shell

update: ## Pull latest code and redeploy (prod)
	./scripts/deploy.sh
