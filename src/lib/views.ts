import { headers } from 'next/headers';
import { getDb, schema } from '@/db';

const DEBOUNCE_MS = 30 * 60 * 1000;

const globalForViews = globalThis as unknown as {
  __viewDebounce?: Map<string, number>;
};
const debounceStore = (globalForViews.__viewDebounce ??= new Map());

/** Client IP from trusted reverse-proxy headers (last X-Forwarded-For entry). */
async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts[parts.length - 1] ?? 'unknown';
  }
  return h.get('x-real-ip') ?? 'unknown';
}

function shouldRecord(galleryId: string, sessionKey: string): boolean {
  const key = `${galleryId}:${sessionKey}`;
  const now = Date.now();
  const last = debounceStore.get(key);
  if (last !== undefined && now - last < DEBOUNCE_MS) return false;
  debounceStore.set(key, now);
  return true;
}

/**
 * Record a gallery page view (debounced to one row per gallery per
 * visitor-or-anonymous-session every 30 minutes). Call from server
 * components when a published gallery page is rendered.
 */
export async function recordGalleryView(
  galleryId: string,
  visitorId: string | null,
  sessionToken?: string | null,
): Promise<void> {
  const sessionKey =
    visitorId ??
    (sessionToken ? `tok:${sessionToken}` : `anon:${await clientIp()}`);
  if (!shouldRecord(galleryId, sessionKey)) return;

  getDb()
    .insert(schema.viewEvents)
    .values({
      galleryId,
      visitorId,
      kind: 'gallery_view',
    })
    .run();
}
