#!/usr/bin/env bash
# ── backup.sh ────────────────────────────────────────────────────────────────
# Backs up the PostgreSQL database and media volume to ./backups/
# Usage: ./scripts/backup.sh [tag]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_DIR="./backups"
TAG="${1:-$(date +%Y%m%d_%H%M%S)}"
DB_FILE="${BACKUP_DIR}/db_${TAG}.sql.gz"
MEDIA_FILE="${BACKUP_DIR}/media_${TAG}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "▶ Backing up database → ${DB_FILE}"
${COMPOSE} exec -T db pg_dump \
    -U "${POSTGRES_USER:-olg}" \
    "${POSTGRES_DB:-openlearngrid}" \
    | gzip > "${DB_FILE}"
echo "  ✓ Database backup complete ($(du -sh "${DB_FILE}" | cut -f1))"

echo "▶ Backing up media → ${MEDIA_FILE}"
${COMPOSE} exec -T backend tar czf - /app/media \
    > "${MEDIA_FILE}" 2>/dev/null
echo "  ✓ Media backup complete ($(du -sh "${MEDIA_FILE}" | cut -f1))"

echo ""
echo "✅ Backup complete — tag: ${TAG}"
echo "   Files saved to: ${BACKUP_DIR}/"
