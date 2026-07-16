import { errorJson, json, requireOwner } from '@/lib/api';
import { getCollaborator, setDisabled } from '@/lib/collaborators';
import { logAdmin } from '@/lib/audit-log';

type Params = { params: Promise<{ collaboratorId: string }> };

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: Params) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { collaboratorId } = await params;

  const collab = getCollaborator(collaboratorId);
  if (!collab) return errorJson('Not found', 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }
  if (typeof body.disabled !== 'boolean') return errorJson('disabled (boolean) required', 400);

  setDisabled(collaboratorId, body.disabled);

  logAdmin(body.disabled ? 'collaborator.disable' : 'collaborator.enable', {
    targetType: 'collaborator',
    targetId: collaboratorId,
    summary: `${body.disabled ? 'Disabled' : 'Enabled'} collaborator ${collab.email}`,
  });

  return json({ ok: true });
}
