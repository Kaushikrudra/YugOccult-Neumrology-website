#!/usr/bin/env bash
# ==============================================================================
# Automated VPS Deployment Script for YugOccult Learning Academy
# Usage: ./deploy/scripts/deploy.sh [branch_name]
# ==============================================================================
set -euo pipefail

# Configuration
APP_DIR="${APP_DIR:-/var/www/yugoccult}"
BRANCH="${1:-main}"

echo "=========================================================="
echo " Starting Deployment for YugOccult Learning Academy"
echo " Target Directory: ${APP_DIR}"
echo " Branch: ${BRANCH}"
echo " Timestamp: $(date -u +"%Y-%m-%d %H:%M:%SZ")"
echo "=========================================================="

cd "${APP_DIR}"

# 1. Fetch latest changes from Git
echo "--> [1/6] Fetching latest changes from git origin/${BRANCH}..."
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

# 2. Server Dependencies & Database Migrations
echo "--> [2/6] Installing server dependencies & running migrations..."
cd "${APP_DIR}/server"
npm ci
npm run migrate

# 3. Build Server TypeScript
echo "--> [3/6] Compiling server TypeScript (tsc)..."
npm run build

# 4. Client Dependencies & Vite Production Build
echo "--> [4/6] Building client bundle..."
cd "${APP_DIR}/client"
npm ci
# Note: Ensure VITE_ALLOW_INDEXING & VITE_SITE_URL are set in /etc/environment or client/.env if indexing is desired
npm run build

# 5. Reload Node.js Application via PM2
echo "--> [5/6] Reloading backend process via PM2..."
cd "${APP_DIR}"
mkdir -p "${APP_DIR}/server/logs"
if pm2 describe yugoccult-api > /dev/null 2>&1; then
    pm2 reload "${APP_DIR}/deploy/pm2/ecosystem.config.cjs" --env production
else
    pm2 start "${APP_DIR}/deploy/pm2/ecosystem.config.cjs" --env production
fi
pm2 save

# 6. Verify and Reload Nginx
echo "--> [6/6] Validating and reloading Nginx..."
if command -v sudo > /dev/null 2>&1; then
    sudo nginx -t
    sudo systemctl reload nginx
else
    nginx -t
    systemctl reload nginx
fi

echo "=========================================================="
echo " Deployment Successfully Completed!"
echo " Backend Status:"
pm2 status yugoccult-api
echo "=========================================================="
