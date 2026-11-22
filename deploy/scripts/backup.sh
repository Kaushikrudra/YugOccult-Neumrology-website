#!/usr/bin/env bash
# ==============================================================================
# Automated Database & Uploads Backup Script for YugOccult Learning Academy
# Usage: Run via cron (e.g., daily at 2:00 AM)
# Cron entry: 0 2 * * * /var/www/yugoccult/deploy/scripts/backup.sh >> /var/log/yugoccult-backup.log 2>&1
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/yugoccult}"
APP_DIR="${APP_DIR:-/var/www/yugoccult}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
RETENTION_DAYS=7

# Load database environment variables if available
if [ -f "${APP_DIR}/server/.env" ]; then
    # Export only DATABASE_URL or DB_* variables
    export $(grep -E '^(DATABASE_URL|DB_NAME|DB_USER|DB_HOST|DB_PORT)=' "${APP_DIR}/server/.env" | xargs)
fi

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%d %H:%M:%SZ")] Starting daily backup..."

# 1. PostgreSQL Database Dump
DB_BACKUP_FILE="${BACKUP_DIR}/yugoccult_db_${TIMESTAMP}.sql.gz"
if [ -n "${DATABASE_URL:-}" ]; then
    pg_dump "${DATABASE_URL}" | gzip -9 > "${DB_BACKUP_FILE}"
    echo "[Backup:DB] Dump saved to ${DB_BACKUP_FILE} ($(du -h "${DB_BACKUP_FILE}" | cut -f1))"
else
    echo "[Backup:DB] Warning: DATABASE_URL not set. Skipping pg_dump."
fi

# 2. Uploads Directory Archive (Materials, PDF reports, banners)
UPLOADS_DIR="${APP_DIR}/server/uploads"
if [ -d "${UPLOADS_DIR}" ]; then
    UPLOADS_BACKUP_FILE="${BACKUP_DIR}/yugoccult_uploads_${TIMESTAMP}.tar.gz"
    tar -czf "${UPLOADS_BACKUP_FILE}" -C "${APP_DIR}/server" uploads
    echo "[Backup:Uploads] Saved to ${UPLOADS_BACKUP_FILE} ($(du -h "${UPLOADS_BACKUP_FILE}" | cut -f1))"
fi

# 3. Retention Cleanup: Remove backups older than 7 days
echo "[Backup:Cleanup] Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "yugoccult_*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} +

echo "[$(date -u +"%Y-%m-%d %H:%M:%SZ")] Backup process completed successfully."
