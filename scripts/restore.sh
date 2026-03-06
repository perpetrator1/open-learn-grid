#!/usr/bin/env bash
# ── restore.sh ───────────────────────────────────────────────────────────────
# Restores a database backup created by backup.sh
# Usage: ./scripts/restore.sh backups/db_20241201_120000.sql.gz
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_FILE="${1:?Usage: ./scripts/restore.sh <backup-file.sql.gz>}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "✗ File not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  This will DROP and recreate the database. Are you sure? [y/N]"
read -r confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

echo "▶ Stopping backend and workers..."
${COMPOSE} stop backend celery_worker celery_beat

echo "▶ Restoring database from ${BACKUP_FILE}..."
${COMPOSE} exec -T db psql \
    -U "${POSTGRES_USER:-olg}" \
    -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-openlearngrid};"
${COMPOSE} exec -T db psql \
    -U "${POSTGRES_USER:-olg}" \
    -c "CREATE DATABASE ${POSTGRES_DB:-openlearngrid};"
zcat "${BACKUP_FILE}" | ${COMPOSE} exec -T db psql \
    -U "${POSTGRES_USER:-olg}" \
    "${POSTGRES_DB:-openlearngrid}"

echo "▶ Restarting services..."
${COMPOSE} start backend celery_worker celery_beat

echo "✅ Restore complete from ${BACKUP_FILE}"
