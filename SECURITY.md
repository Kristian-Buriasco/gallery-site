# Security Policy

## Security model

Albm is a **single-admin, self-hosted** app. There is one admin
identity (password and/or passkeys); there are no visitor accounts. Client
galleries are reached at unguessable URLs and may be individually
password-protected. TLS is expected to be terminated by a reverse proxy in
front of the app.

The app makes **no outbound network requests** except an optional daily
GitHub release check, which `DISABLE_UPDATE_CHECK=1` turns off.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

Use GitHub's **"Report a vulnerability"** (Security → Advisories) on the
repository, or email the maintainer. Include steps to reproduce and the
affected version. You'll get an acknowledgement as soon as possible, and a
coordinated disclosure once a fix is available.

## Good practice for operators

- Set a strong `SESSION_SECRET` (`openssl rand -hex 32`) and keep it stable.
- Set `ADMIN_PASSWORD_HASH`, or register a passkey and disable password login.
- Serve only over HTTPS (WebAuthn/passkeys require a secure origin).
- Back up `DATA_DIR` — it holds your database and photos. Migration backups
  land in `DATA_DIR/backups/`.
