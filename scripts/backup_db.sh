#!/usr/bin/env bash
# ==============================================================================
# VoltGrid Automated Database Backup Utility
# Dumps compressed PostgreSQL snapshots with retention rotation.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-voltgrid-postgres}"
DB_NAME="${DB_NAME:-voltgrid_db}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/voltgrid_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

echo "[VoltGrid Backup] Starting PostgreSQL dump from container '${DB_CONTAINER}'..."
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[VoltGrid Backup] Successfully generated snapshot: ${BACKUP_FILE} (${FILE_SIZE})"

# Prune snapshots older than retention days
echo "[VoltGrid Backup] Pruning snapshots older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "voltgrid_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;
echo "[VoltGrid Backup] Backup routine completed successfully."
