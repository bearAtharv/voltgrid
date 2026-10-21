#!/usr/bin/env bash
# ==============================================================================
# VoltGrid Automated Database Restore Utility
# Restores a compressed SQL snapshot into the PostgreSQL container.
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="${DB_CONTAINER:-voltgrid-postgres}"
DB_NAME="${DB_NAME:-voltgrid_db}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

echo "[VoltGrid Restore] Restoring snapshot '${BACKUP_FILE}' into container '${DB_CONTAINER}'..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "[VoltGrid Restore] Snapshot successfully restored."
