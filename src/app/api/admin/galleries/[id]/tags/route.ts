import { eq } from 'drizzle-orm';
import { requireAdmin, errorJson, json } from '@/lib/api';
import { getDb, schema } from '@/db';
import {
  assignTagToGallery,
  createTag,
  getGalleryTags,
  tagExists,
  unassignTagFromGallery,
} from '@/lib/tags';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const gallery = getDb()
    .select({ id: schema.galleries.id })
    .from(schema.galleries)
    .where(eq(schema.galleries.id, id))
    .get();
  if (!gallery) return errorJson('Not found', 404);

  return json({ tags: getGalleryTags(id) });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const gallery = getDb()
    .select({ id: schema.galleries.id })
    .from(schema.galleries)
    .where(eq(schema.galleries.id, id))
    .get();
  if (!gallery) return errorJson('Not found', 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  const { tagId, tagName } =
    typeof body === 'object' && body !== null
      ? (body as { tagId?: unknown; tagName?: unknown })
      : {};

  let resolvedTagId: string;
  if (typeof tagId === 'string') {
    if (!tagExists(tagId)) return errorJson('Unknown tag', 400);
    resolvedTagId = tagId;
  } else if (typeof tagName === 'string') {
    resolvedTagId = createTag(tagName).id;
  } else {
    return errorJson('tagId or tagName required', 400);
  }

  assignTagToGallery(id, resolvedTagId);
  return json({ ok: true, tags: getGalleryTags(id) });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  const tagId =
    typeof body === 'object' && body !== null && 'tagId' in body
      ? (body as { tagId: unknown }).tagId
      : null;

  if (typeof tagId !== 'string') return errorJson('tagId required', 400);

  unassignTagFromGallery(id, tagId);
  return json({ ok: true, tags: getGalleryTags(id) });
}
