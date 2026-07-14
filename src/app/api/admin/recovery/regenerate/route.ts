import { requireAdmin, json } from '@/lib/api';
import { regenerateRecoveryCodes } from '@/lib/recovery-codes';

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const codes = await regenerateRecoveryCodes();
  return json({ ok: true, codes });
}
