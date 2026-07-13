import path from 'node:path';

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? './data');

const DEV_SESSION_FALLBACK =
  'insecure-dev-session-secret-change-me-0123456789abcdef';

/** Read SESSION_SECRET at runtime (never rely on a build-time constant). */
export function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!value || value === DEV_SESSION_FALLBACK) {
      throw new Error('SESSION_SECRET is required in production');
    }
    return value;
  }
  return value ?? DEV_SESSION_FALLBACK;
}

/** Read ADMIN_PASSWORD_HASH at runtime. */
export function adminPasswordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH ?? '';
}

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3200';

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kristian Buriasco';
