<div align="center">

# Albm

**Self-hosted photography portfolio and client proofing galleries you own.**

Public portfolio, private client galleries, downloads, event tools, and passkey admin — one Next.js app on SQLite and local files. No external services required.

[![Release](https://img.shields.io/github/v/release/Kristian-Buriasco/albm?color=111)](https://github.com/Kristian-Buriasco/albm/releases)
[![CI](https://github.com/Kristian-Buriasco/albm/actions/workflows/ci.yml/badge.svg)](https://github.com/Kristian-Buriasco/albm/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Container: GHCR](https://img.shields.io/badge/ghcr.io-albm-2496ED?logo=docker&logoColor=white)](https://github.com/Kristian-Buriasco/albm/pkgs/container/albm)
[![Wiki](https://img.shields.io/badge/docs-wiki-111)](https://github.com/Kristian-Buriasco/albm/wiki)

</div>

<p align="center">
  <a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots"><img src="docs/screenshots/portfolio.png" alt="Homepage" width="32%" /></a>
  <a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots"><img src="docs/screenshots/client-gallery.png" alt="Client gallery" width="32%" /></a>
  <a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots"><img src="docs/screenshots/admin.png" alt="Admin" width="32%" /></a>
</p>

<p align="center"><a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots">More screenshots → Wiki</a></p>

---

## Quick start

```bash
git clone https://github.com/Kristian-Buriasco/albm.git
cd albm

export SESSION_SECRET=$(openssl rand -hex 32)
export BASE_URL=https://gallery.example.com   # your real https origin

docker compose up -d --build
docker compose logs -f            # first run prints a temporary admin password
```

1. Log in at `/admin/login` with the password from the logs  
2. Add a passkey under **Settings → Security**  
3. Put HTTPS in front (Caddy, nginx, NPM) — passkeys need a secure origin  

Image: **`ghcr.io/kristian-buriasco/albm`** (pin a version in production).

---

## Full docs → [Wiki](https://github.com/Kristian-Buriasco/albm/wiki)

Setup, configuration, features, client galleries, publish API, deployment, development, security, and FAQ.

| | |
|---|---|
| Threat model / reporting | [SECURITY.md](SECURITY.md) |
| Lightroom / Capture One upload API | [docs/EXPORT.md](docs/EXPORT.md) |
| Releases | [Releases](https://github.com/Kristian-Buriasco/albm/releases) |

---

## License

[AGPL-3.0-only](LICENSE) — Copyright (C) 2026 Kristian Buriasco.

**Albm** is maintained by [Kristian Buriasco](https://github.com/Kristian-Buriasco).
