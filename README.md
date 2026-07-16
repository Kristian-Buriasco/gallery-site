<div align="center">

# Albm

**Self-hosted photography portfolio and client proofing galleries you own.**

Public portfolio, private client galleries, downloads, event tools, and passkey admin — one Next.js app on SQLite and local files. No external services required.

[![Release](https://img.shields.io/github/v/release/Kristian-Buriasco/Albm?color=111)](https://github.com/Kristian-Buriasco/Albm/releases)
[![CI](https://github.com/Kristian-Buriasco/Albm/actions/workflows/ci.yml/badge.svg)](https://github.com/Kristian-Buriasco/Albm/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Container: GHCR](https://img.shields.io/badge/ghcr.io-albm-2496ED?logo=docker&logoColor=white)](https://github.com/Kristian-Buriasco/Albm/pkgs/container/albm)

</div>

---

## Screenshots

### Public site

| Homepage | Contact |
|---|---|
| ![Homepage with Featured Work](docs/screenshots/portfolio.png) | ![Contact with Instagram and WhatsApp](docs/screenshots/contact.png) |

### Client proofing

| Gallery grid | Lightbox & favorites | Event page |
|---|---|---|
| ![Client proofing grid](docs/screenshots/client-gallery.png) | ![Lightbox with favorites and slideshow](docs/screenshots/client-lightbox.png) | ![Public event page with bib search](docs/screenshots/event-page.png) |

### Admin

| Dashboard | Gallery detail | Security | Audit |
|---|---|---|---|
| ![Admin dashboard with charts](docs/screenshots/admin.png) | ![Sections, tags, and bulk select](docs/screenshots/admin-gallery.png) | ![Passkeys and recovery codes](docs/screenshots/security.png) | ![Admin audit log](docs/screenshots/audit.png) |

---

## Quick start

```bash
git clone https://github.com/Kristian-Buriasco/Albm.git
cd Albm

export SESSION_SECRET=$(openssl rand -hex 32)
export BASE_URL=https://gallery.example.com   # your real https origin

docker compose up -d --build
docker compose logs -f            # first run prints a temporary admin password
```

1. Open the site → log in at `/admin/login` with the password from the logs  
2. Add a passkey under **Settings → Security**  
3. Put a reverse proxy (Caddy, nginx, NPM) in front for HTTPS — passkeys need a secure origin  

Prebuilt image: **`ghcr.io/kristian-buriasco/albm`** (pin a version in production, not `:latest`).

```bash
docker run -e SESSION_SECRET=$(openssl rand -hex 32) -v gallery:/data \
  -p 3200:3200 ghcr.io/kristian-buriasco/albm:latest
```

> **Photographers / self-hosters:** continue with [Configuration](#configuration) and [Updating](#updating) below.  
> **Contributors:** jump to [Development](#development).

---

## What you can do

> Many extras (live upload, bib/face search, forensic watermark, event page, …) are **off by default per gallery**. Turn on only what you need.

### Show your work
- Featured and More Work grids, searchable by title, tags, and year
- Editable hero, about, contact, and footer from admin
- Portfolio lightbox with optional anonymous likes

### Proof with clients
- Private galleries at unguessable URLs; optional password, PIN, and expiry
- Sections, tags, favorites, moderated comments, and selection limits
- Magic-link “Save my selections” (copyable link + QR; no email server)

### Deliver files
- Single photo, full-gallery ZIP, or favorites-only ZIP when downloads are enabled
- Optional Web / Print / Original sizes; GPS stripped on download by default
- Visible watermark; optional invisible forensic mark (default off)

### Run events
- Live upload while a shoot is in progress
- Bib-number search and selfie face match for attendees (opt-in; face match stays in memory)
- Public event page with venue QR

### Run the box
- Passkey login, recovery codes, audit log, session revoke
- Safe upgrades (DB backed up before each migration)
- Optional gallery collaborators; upload tokens for Lightroom / Capture One — see [`docs/EXPORT.md`](docs/EXPORT.md)

Threat model and vulnerability reporting: [SECURITY.md](SECURITY.md).

---

## Configuration

Copy `.env.example` to `.env` (or set these in Compose):

| Var | Purpose |
|---|---|
| `SESSION_SECRET` | **Required in prod.** `openssl rand -hex 32` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash; empty → temp password in logs. `node scripts/hash-password.mjs 'pw'` |
| `BASE_URL` | Public https origin (share links + passkeys) |
| `DATA_DIR` | Runtime data root (Docker volume, default `/data`) |
| `PORT` | HTTP port (default `3200`) |
| `NEXT_PUBLIC_SITE_NAME` | Site name (default `Albm`) |
| `RP_ID` | Optional WebAuthn RP ID override |
| `DISABLE_UPDATE_CHECK` | `1` to skip the daily GitHub release check |

All photos and the SQLite DB live under `DATA_DIR`. Nothing there is served statically — every image goes through an auth-checked handler.

```
DATA_DIR/
  gallery.db
  backups/gallery-<timestamp>.db
  photos/<galleryId>/{originals,web,thumb,print}/…
```

**Back up `DATA_DIR`** — that is your galleries and database.

---

## Updating

```bash
docker compose pull && docker compose up -d
```

Migrations run on boot after backing up the DB. The admin panel badges newer releases (opt out with `DISABLE_UPDATE_CHECK=1`).

**Health check:** `GET /api/health` → `{ ok: true }` when the DB is readable. Point Uptime Kuma / Home Assistant at it (200 healthy, 500 if DB is down). The image `HEALTHCHECK` uses the same endpoint.

### Bare-metal (no Docker)

```bash
npm ci && npm run build
cp -r .next/static .next/standalone/.next/static
SESSION_SECRET=… BASE_URL=… DATA_DIR=/var/lib/gallery/data node .next/standalone/server.js
```

Templates in [`deploy/`](deploy): `systemd` unit and `update.sh`. Rebuild native modules for the host (`npm rebuild`). On older toolchains that cannot compile `better-sqlite3` v12, pin **`better-sqlite3@11.10.0`** (already pinned here).

When setting `ADMIN_PASSWORD_HASH`, wrap the bcrypt hash in single quotes so `$2b$…` is not mangled by the shell.

**Host notes (older macOS):** Bib OCR and face search use WASM so they build without native ONNX. Optional `dcraw` improves proprietary RAW decode (`DCRAW_PATH` if not on `PATH`).

---

## Development

For contributors working on the code:

```bash
npm ci
cp .env.example .env      # set SESSION_SECRET
npm run dev               # http://localhost:3200
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

```bash
npm run test:e2e:install   # once
npm run test:e2e           # Playwright; throwaway data dir
```

CI runs typecheck, lint, build, and `test:e2e` on PRs.

**Stack:** Next.js 15 (App Router, standalone) · SQLite + Drizzle + better-sqlite3 · sharp · Tailwind · iron-session · `@simplewebauthn` · Playwright. Optional: `tesseract.js`, `@vladmandic/face-api` + WASM TensorFlow. Required native modules: `sharp`, `better-sqlite3`.

---

## Roadmap

**Shipped** — portfolio, client proofing, passkeys, downloads/watermarks, events (live/bib/face), collaborators, publish API, Docker + GHCR, and the rest of the feature list above.

**Later (when needed):** object-storage backend, multi-photographer / studio mode.

Out of scope for now: automated backups, email/SMTP notifications.

---

## License

[AGPL-3.0-only](LICENSE) — Copyright (C) 2026 Kristian Buriasco. A modified version run as a network service must make its source available (AGPL network clause).

---

**Albm** is maintained by [Kristian Buriasco](https://github.com/Kristian-Buriasco) — sport and event photographer based in Leuven, Belgium.
