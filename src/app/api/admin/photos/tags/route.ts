import { inArray } from 'drizzle-orm';
import { requireGalleryCapability, errorJson, json } from '@/lib/api';
import { getDb, schema } from '@/db';
import {
  assignTagToPhotos,
  createTag,
  tagExists,
  unassignTagFromPhotos,
} from '@/lib/tags';

/** Every photo in `ids` must belong to a gallery the caller holds 'organize' on. */
async function requireOrganizeOnPhotoGalleries(
  ids: string[],
): Promise<{ denied: Response | null; galleryIds: string[] }> {
  const rows = getDb()
    .select({ id: schema.photos.id, galleryId: schema.photos.galleryId })
    .from(schema.photos)
    .where(inArray(schema.photos.id, ids))
    .all();
  if (rows.length !== ids.length) {
    return { denied: errorJson('Invalid photoIds', 400), galleryIds: [] };
  }
  const galleryIds = [...new Set(rows.map((r) => r.galleryId))];
  for (const galleryId of galleryIds) {
    const denied = await requireGalleryCapability(galleryId, 'organize');
    if (denied) return { denied, galleryIds };
  }
  return { denied: null, galleryIds };
}

export async function POST(req: Request) {
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
  const { denied } = await requireOrganizeOnPhotoGalleries(ids);
  if (denied) return denied;

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
  if (photoIds.length === 0) return errorJson('photoIds required', 400);

  const { denied } = await requireOrganizeOnPhotoGalleries(photoIds as string[]);
  if (denied) return denied;

  unassignTagFromPhotos(photoIds as string[], tagId);
  return json({ ok: true });
}
