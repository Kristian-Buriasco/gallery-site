import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { errorJson, json, requireOwner } from '@/lib/api';
import { inviteCollaborator, listGalleryCollaborators, normalizeEmail } from '@/lib/collaborators';
import { logAdmin } from '@/lib/audit-log';
import { BASE_URL } from '@/lib/env';

type Params = { params: Promise<{ id: string }> };

const EMAIL_MAX = 320;
const NAME_MAX = 200;

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: Params) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await params;

  const gallery = getDb().select().from(schema.galleries).where(eq(schema.galleries.id, id)).get();
  if (!gallery) return errorJson('Not found', 404);

  return json({ collaborators: listGalleryCollaborators(id) });
}

export async function POST(req: Request, { params }: Params) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await params;

  const gallery = getDb().select().from(schema.galleries).where(eq(schema.galleries.id, id)).get();
  if (!gallery) return errorJson('Not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim().slice(0, EMAIL_MAX) : '';
  if (!emailRaw || !emailRaw.includes('@')) return errorJson('Valid email required', 400);
  const name =
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, NAME_MAX) : null;

  const { collaboratorId, rawToken, expiresAt } = inviteCollaborator({
    galleryId: id,
    email: normalizeEmail(emailRaw),
    name,
    createdBy: null,
  });

  logAdmin('collaborator.invite', {
    targetType: 'gallery',
    targetId: id,
    summary: `Invited collaborator to "${gallery.title}"`,
  });

  return json(
    {
      collaboratorId,
      onboardingUrl: `${BASE_URL.replace(/\/$/, '')}/collab/${rawToken}`,
      expiresAt,
    },
    201,
  );
}
