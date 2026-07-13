import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDb, schema } from '@/db';
import type { Gallery } from '@/db/schema';
import { errorJson, json } from '@/lib/api';
import { ipFromRequest } from '@/lib/rate-limit';
import { isAdmin } from '@/lib/session';

const LIKER_COOKIE = 'liker';
const YEAR_SECONDS = 365 * 24 * 60 * 60;

// Light write rate limit: 60/min/IP, just to prevent junk inserts.
const WRITE_WINDOW_MS = 60 * 1000;
const WRITE_MAX = 60;
const globalForLikes = globalThis as unknown as {
  __likeWrites?: Map<string, number[]>;
};
const writeLog = (globalForLikes.__likeWrites ??= new Map());

function writeAllowed(ip: string): boolean {
  const now = Date.now();
  const times = (writeLog.get(ip) ?? []).filter((t: number) => now - t < WRITE_WINDOW_MS);
  if (times.length >= WRITE_MAX) {
    writeLog.set(ip, times);
    return false;
  }
  times.push(now);
  writeLog.set(ip, times);
  return true;
}

type Params = { params: Promise<{ slug: string }> };

async function resolveGallery(slug: string): Promise<Gallery | Response> {
  const gallery = getDb()
    .select()
    .from(schema.galleries)
    .where(
      and(eq(schema.galleries.slug, slug), eq(schema.galleries.type, 'portfolio')),
    )
    .get();
  // Unknown or unpublished => 404 (same existence semantics as image routes).
  if (!gallery || (!gallery.published && !(await isAdmin()))) {
    return errorJson('Not found', 404);
  }
  return gallery;
}

async function getLikerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(LIKER_COOKIE)?.value ?? null;
}

async function ensureLikerToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(LIKER_COOKIE)?.value;
  if (existing && existing.length >= 32) return existing;
  const token = crypto.randomBytes(24).toString('hex'); // 48 chars
  store.set(LIKER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: YEAR_SECONDS,
  });
  return token;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const gallery = await resolveGallery(slug);
  if (gallery instanceof Response) return gallery;

  const token = await getLikerToken();
  if (!token) return json({ photoIds: [] });

  const rows = getDb()
    .select({ photoId: schema.likes.photoId })
    .from(schema.likes)
    .innerJoin(schema.photos, eq(schema.likes.photoId, schema.photos.id))
    .where(
      and(
        eq(schema.likes.likerToken, token),
        eq(schema.photos.galleryId, gallery.id),
      ),
    )
    .all();
  return json({ photoIds: rows.map((r) => r.photoId) });
}

async function parsePhotoId(req: Request): Promise<string | null> {
  try {
    const body = await req.json();
    return typeof body.photoId === 'string' ? body.photoId : null;
  } catch {
    return null;
  }
}

function findGalleryPhoto(galleryId: string, photoId: string) {
  const photo = getDb()
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, photoId))
    .get();
  if (!photo || photo.galleryId !== galleryId || photo.status !== 'ready') {
    return null;
  }
  return photo;
}

export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const gallery = await resolveGallery(slug);
  if (gallery instanceof Response) return gallery;
  if (!writeAllowed(ipFromRequest(req))) {
    return errorJson('Too many requests', 429);
  }

  const photoId = await parsePhotoId(req);
  if (!photoId) return errorJson('photoId required', 400);
  if (!findGalleryPhoto(gallery.id, photoId)) {
    return errorJson('Photo not found', 404);
  }

  const token = await ensureLikerToken();
  getDb()
    .insert(schema.likes)
    .values({ photoId, likerToken: token })
    .onConflictDoNothing()
    .run();
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const { slug } = await params;
  const gallery = await resolveGallery(slug);
  if (gallery instanceof Response) return gallery;
  if (!writeAllowed(ipFromRequest(req))) {
    return errorJson('Too many requests', 429);
  }

  const photoId = await parsePhotoId(req);
  if (!photoId) return errorJson('photoId required', 400);

  const token = await getLikerToken();
  if (!token) return json({ ok: true });

  getDb()
    .delete(schema.likes)
    .where(
      and(eq(schema.likes.photoId, photoId), eq(schema.likes.likerToken, token)),
    )
    .run();
  return json({ ok: true });
}
