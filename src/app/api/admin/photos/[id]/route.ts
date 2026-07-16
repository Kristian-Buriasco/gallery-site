import fs from 'node:fs';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { errorJson, json, requireAdmin } from '@/lib/api';
import { originalPath, thumbPath, webPath } from '@/lib/paths';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const db = getDb();
  const photo = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  if (!photo) return errorJson('Not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  const updates: Partial<typeof schema.photos.$inferInsert> = {
    updatedAt: Date.now(),
  };
  if (typeof body.altText === 'string') {
    updates.altText = body.altText.trim().slice(0, 300) || null;
  }

  db.update(schema.photos).set(updates).where(eq(schema.photos.id, id)).run();
  const updated = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  return json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const db = getDb();
  const photo = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  if (!photo) return errorJson('Not found', 404);

  db.delete(schema.photos).where(eq(schema.photos.id, id)).run();

  db.update(schema.galleries)
    .set({ coverPhotoId: null, updatedAt: Date.now() })
    .where(eq(schema.galleries.coverPhotoId, id))
    .run();

  for (const p of [
    originalPath(photo.galleryId, photo.filename),
    webPath(photo.galleryId, photo.filename),
    thumbPath(photo.galleryId, photo.filename),
  ]) {
    fs.rmSync(p, { force: true });
  }

  return json({ ok: true });
}
