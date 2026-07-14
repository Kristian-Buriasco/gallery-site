import { BASE_URL, SITE_NAME } from './env';

/** WebAuthn RP ID — host of BASE_URL unless overridden. */
export function rpId(): string {
  const override = process.env.RP_ID?.trim();
  if (override) return override;
  try {
    return new URL(BASE_URL).hostname;
  } catch {
    return 'localhost';
  }
}

export function rpName(): string {
  return SITE_NAME;
}

/** Full origin WebAuthn expects (must match the browser URL). */
export function expectedOrigin(): string {
  return BASE_URL.replace(/\/$/, '');
}

/** Fixed user handle for the single admin identity. */
export const ADMIN_USER_ID = Buffer.from('admin', 'utf8');

export const ADMIN_USER_NAME = 'admin';

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
