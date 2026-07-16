<div align="center">

# Albm

**Self-hosted photography portfolio and client proofing galleries you own.**

[![Release](https://img.shields.io/github/v/release/Kristian-Buriasco/Albm?color=111)](https://github.com/Kristian-Buriasco/Albm/releases)
[![CI](https://github.com/Kristian-Buriasco/Albm/actions/workflows/ci.yml/badge.svg)](https://github.com/Kristian-Buriasco/Albm/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Container: GHCR](https://img.shields.io/badge/ghcr.io-albm-2496ED?logo=docker&logoColor=white)](https://github.com/Kristian-Buriasco/Albm/pkgs/container/albm)

</div>

Public portfolio, private client galleries, downloads, and event tools — one Next.js app on SQLite and local files. No external services required.

<p align="center">
  <a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots"><img src="docs/screenshots/portfolio.png" alt="Homepage" width="32%" /></a>
  <a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots"><img src="docs/screenshots/client-gallery.png" alt="Client gallery" width="32%" /></a>
  <a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots"><img src="docs/screenshots/admin.png" alt="Admin" width="32%" /></a>
</p>

<p align="center"><a href="https://github.com/Kristian-Buriasco/albm/wiki/Screenshots">Screenshots → Wiki</a></p>

## Get started

```bash
git clone https://github.com/Kristian-Buriasco/Albm.git && cd Albm
export SESSION_SECRET=$(openssl rand -hex 32)
export BASE_URL=https://gallery.example.com   # your real https origin
docker compose up -d --build
docker compose logs -f            # first run prints a temporary admin password
```

Log in at `/admin/login`, add a passkey under **Settings → Security**, and put HTTPS in front. Full walkthrough: [Wiki → Quick Start](https://github.com/Kristian-Buriasco/albm/wiki/Quick-Start).

Image: `ghcr.io/kristian-buriasco/albm` (pin a version in production).

## Docs

| | |
|---|---|
| [Wiki](https://github.com/Kristian-Buriasco/albm/wiki) | Features, config, deployment, FAQ |
| [docs/EXPORT.md](docs/EXPORT.md) | Lightroom / Capture One publish API |
| [SECURITY.md](SECURITY.md) | Threat model & vulnerability reporting |
| [Releases](https://github.com/Kristian-Buriasco/albm/releases) | Changelog |
| [GHCR](https://github.com/Kristian-Buriasco/albm/pkgs/container/albm) | Container images |

## License

[AGPL-3.0-only](LICENSE) — Copyright (C) 2026 Kristian Buriasco.

**Albm** is maintained by [Kristian Buriasco](https://github.com/Kristian-Buriasco) — sport and event photographer based in Leuven, Belgium.
