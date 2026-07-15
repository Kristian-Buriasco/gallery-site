import { requireAdmin, errorJson, json } from '@/lib/api';
import { createTag, listTags, normalizeTagName } from '@/lib/tags';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json({ tags: listTags() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  const name =
    typeof body === 'object' && body !== null && 'name' in body
      ? (body as { name: unknown }).name
      : null;

  if (typeof name !== 'string' || !normalizeTagName(name)) {
    return errorJson('Invalid tag name', 400);
  }

  const tag = createTag(name);
  return json({ ok: true, tag });
}
