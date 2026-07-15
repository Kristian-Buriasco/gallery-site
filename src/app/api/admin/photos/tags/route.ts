import { inArray } from 'drizzle-orm';
import { requireAdmin, errorJson, json } from '@/lib/api';
import { getDb, schema } from '@/db';
import {
  assignTagToPhotos,
  createTag,
  tagExists,
  unassignTagFromPhotos,
} from '@/lib/tags';

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  if (typeof body !== 'object' || body === null) {
    return errorJson('Invalid request', 400);
  }

  const { photoIds, tagId, tagName } = body as {
    photoIds?: unknown;
    tagId?: unknown;
    tagName?: unknown;
  };

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return errorJson('photoIds required', 400);
  }
  if (!photoIds.every((id) => typeof id === 'string')) {
    return errorJson('Invalid photoIds', 400);
  }
  if (photoIds.length > 500) {
    return errorJson('Too many photos', 400);
  }

  const ids = photoIds as string[];
  const count = getDb()
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(inArray(schema.photos.id, ids))
    .all().length;
  if (count !== ids.length) return errorJson('Invalid photoIds', 400);

  let resolvedTagId: string;
  if (typeof tagId === 'string') {
    if (!tagExists(tagId)) return errorJson('Unknown tag', 400);
    resolvedTagId = tagId;
  } else if (typeof tagName === 'string') {
    resolvedTagId = createTag(tagName).id;
  } else {
    return errorJson('tagId or tagName required', 400);
  }

  assignTagToPhotos(ids, resolvedTagId);
  return json({ ok: true, tagId: resolvedTagId });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  if (typeof body !== 'object' || body === null) {
    return errorJson('Invalid request', 400);
  }

  const { photoIds, tagId } = body as { photoIds?: unknown; tagId?: unknown };

  if (!Array.isArray(photoIds) || !photoIds.every((id) => typeof id === 'string')) {
    return errorJson('photoIds required', 400);
  }
  if (typeof tagId !== 'string') return errorJson('tagId required', 400);

  unassignTagFromPhotos(photoIds as string[], tagId);
  return json({ ok: true });
}
