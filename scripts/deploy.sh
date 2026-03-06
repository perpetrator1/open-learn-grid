#!/usr/bin/env bash
# ── deploy.sh ────────────────────────────────────────────────────────────────
# Zero-downtime-ish deployment: pull → build → migrate → restart
# Usage: ./scripts/deploy.sh [git-ref]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"
GIT_REF="${1:-main}"

echo "▶ Pulling latest code (${GIT_REF})..."
git fetch origin
git checkout "${GIT_REF}"
git pull origin "${GIT_REF}"

echo "▶ Building new images..."
${COMPOSE} build --no-cache backend nginx

echo "▶ Running database migrations..."
${COMPOSE} run --rm backend python manage.py migrate --noinput

echo "▶ Collecting static files..."
${COMPOSE} run --rm backend python manage.py collectstatic --noinput --clear

echo "▶ Restarting services..."
${COMPOSE} up -d --remove-orphans

echo "▶ Waiting for health check..."
sleep 5
STATUS=$(curl -sf http://localhost/api/health/ | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")

if [[ "${STATUS}" == "healthy" || "${STATUS}" == "degraded" ]]; then
    echo "✅ Deployment complete — instance status: ${STATUS}"
else
    echo "⚠️  Deploy finished but health check returned: ${STATUS}"
    echo "   Run: docker compose -f docker-compose.prod.yml logs backend"
fi
