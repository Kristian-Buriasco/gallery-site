import { requireAdmin, json } from '@/lib/api';
import { regenerateRecoveryCodes } from '@/lib/recovery-codes';
import { logAdmin } from '@/lib/audit-log';

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const codes = await regenerateRecoveryCodes();
  logAdmin('security.recovery_codes', {
    targetType: 'setting',
    summary: 'Recovery codes regenerated',
  });
  return json({ ok: true, codes });
}
