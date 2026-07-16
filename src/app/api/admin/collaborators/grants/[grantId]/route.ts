import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { errorJson, json, requireOwner } from '@/lib/api';
import { revokeGrant } from '@/lib/collaborators';
import { logAdmin } from '@/lib/audit-log';

type Params = { params: Promise<{ grantId: string }> };

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { grantId } = await params;

  const grant = getDb()
    .select()
    .from(schema.galleryGrants)
    .where(eq(schema.galleryGrants.id, grantId))
    .get();
  if (!grant) return errorJson('Not found', 404);

  const ok = revokeGrant(grantId);
  if (!ok) return errorJson('Already revoked', 400);

  logAdmin('collaborator.revoke', {
    targetType: 'gallery_grant',
    targetId: grantId,
    summary: `Revoked collaborator grant on gallery ${grant.galleryId}`,
  });

  return json({ ok: true });
}
