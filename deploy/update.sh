#!/usr/bin/env bash
# Bare-metal update helper. Backs up the DB, swaps in a freshly built
# standalone bundle (preserving DATA_DIR), and restarts the service.
#
# Usage (from a checkout of the new version):
#   DATA_DIR=/opt/gallery/data APP_DIR=/opt/gallery SERVICE=gallery ./deploy/update.sh
#
# Assumes `npm ci && npm run build` succeeds in the current directory.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/gallery}"
DATA_DIR="${DATA_DIR:-$APP_DIR/data}"
SERVICE="${SERVICE:-gallery}"

echo ">> Building..."
npm ci
npm run build

echo ">> Backing up database..."
if [ -f "$DATA_DIR/gallery.db" ]; then
  mkdir -p "$DATA_DIR/backups"
  cp "$DATA_DIR/gallery.db" "$DATA_DIR/backups/gallery-$(date +%Y%m%d-%H%M%S).db"
fi

echo ">> Stopping $SERVICE..."
systemctl stop "$SERVICE" || true

echo ">> Swapping app files (preserving data)..."
# Remove old app files but keep the data directory if it lives under APP_DIR.
find "$APP_DIR" -mindepth 1 -maxdepth 1 \
  ! -name "$(basename "$DATA_DIR")" ! -name gallery.env -exec rm -rf {} +
cp -R .next/standalone/. "$APP_DIR/"
mkdir -p "$APP_DIR/.next"
cp -R .next/static "$APP_DIR/.next/static"

echo ">> Starting $SERVICE (migrations apply on boot)..."
systemctl start "$SERVICE"
echo ">> Done."
