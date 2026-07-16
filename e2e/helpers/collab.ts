import path from 'node:path';
import Database from 'better-sqlite3';
import { sealData } from 'iron-session';
import { nanoid } from 'nanoid';
import type { APIRequestContext, BrowserContext } from '@playwright/test';
import { request as playwrightRequest } from '@playwright/test';

const WEEK_SECONDS = 7 * 24 * 60 * 60;
const SESSION_SECRET = 'e2e-test-session-secret-0123456789abcdef0123456789ab';

/**
 * Directly seed an `admin_sessions` row for a collaborator (bypassing the
 * WebAuthn ceremony, which Playwright can't drive) and seal the same
 * iron-session cookie `issueAdminSession` would produce. This tests the
 * AUTHORIZATION layer (requireGalleryCapability / requireOwner), not the
 * passkey UI — per FIXES-8's E2E guidance.
 */
export async function sealCollaboratorSessionCookie(
  dataDir: string,
  collaboratorId: string,
): Promise<string> {
  const db = new Database(path.join(dataDir, 'gallery.db'));
  try {
    const sessionId = nanoid();
    const now = Date.now();
    db.prepare(
      `INSERT INTO admin_sessions (id, created_at, last_seen_at, collaborator_id) VALUES (?, ?, ?, ?)`,
    ).run(sessionId, now, now, collaboratorId);

    return await sealData(
      { isAdmin: true, sessionId },
      { password: SESSION_SECRET, ttl: WEEK_SECONDS },
    );
  } finally {
    db.close();
  }
}

/** A Playwright APIRequestContext authenticated as the given collaborator. */
export async function collaboratorApiContext(
  baseUrl: string,
  dataDir: string,
  collaboratorId: string,
): Promise<APIRequestContext> {
  const sealed = await sealCollaboratorSessionCookie(dataDir, collaboratorId);
  const url = new URL(baseUrl);
  return playwrightRequest.newContext({
    baseURL: baseUrl,
    storageState: {
      cookies: [
        {
          name: 'admin_session',
          value: sealed,
          domain: url.hostname,
          path: '/',
          expires: Math.floor(Date.now() / 1000) + WEEK_SECONDS,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    },
  });
}

/** Attach a collaborator session cookie to a browser context (for UI tests). */
export async function addCollaboratorCookie(
  context: BrowserContext,
  baseUrl: string,
  dataDir: string,
  collaboratorId: string,
): Promise<void> {
  const sealed = await sealCollaboratorSessionCookie(dataDir, collaboratorId);
  const url = new URL(baseUrl);
  await context.addCookies([
    {
      name: 'admin_session',
      value: sealed,
      domain: url.hostname,
      path: '/',
      expires: Math.floor(Date.now() / 1000) + WEEK_SECONDS,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
