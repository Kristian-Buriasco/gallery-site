# Contributing

Thanks for your interest in gallery-site.

## Dev setup

```bash
npm ci
cp .env.example .env         # fill SESSION_SECRET at least
npm run dev                  # http://localhost:3200
```

On first run with no `ADMIN_PASSWORD_HASH`, a temporary admin password is
printed to the console — use it at `/admin/login`.

## Checks (run before opening a PR)

```bash
npm run typecheck
npm run lint
npm run build
```

CI runs the same three on every PR.

## Database & migrations

- SQLite via Drizzle ORM. Schema lives in `src/db/schema.ts`.
- After changing the schema, generate a migration:
  ```bash
  npm run db:generate
  ```
  Commit the generated files in `drizzle/`. Migrations apply automatically at
  boot; an existing database is backed up to `DATA_DIR/backups/` first, and a
  failed migration aborts startup rather than serving a half-migrated DB.

## Conventions

- TypeScript, App Router, server components by default; `'use client'` only
  where needed.
- Keep the security bar: server-side length caps + rate limiting on public
  writes, existence-404 (not 403) for unpublished galleries, never render
  user input as HTML, no new outbound network calls.
- Self-contained only — no external CDN/font/script requests from pages.

## Scope

This is a focused single-admin app. Please open an issue to discuss larger
features (multi-tenant, plugins, etc.) before building them.
