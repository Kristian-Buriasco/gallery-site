import { requireAdmin, errorJson, json } from '@/lib/api';
import { deleteTag } from '@/lib/tags';

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!id) return errorJson('Not found', 404);

  deleteTag(id);
  return json({ ok: true });
}
