import { requireAdmin, errorJson, json } from '@/lib/api';
import {
  canDisablePasswordLogin,
  isPasswordLoginEnabled,
  setPasswordLoginEnabled,
} from '@/lib/admin-auth-settings';
import { listPasskeys } from '@/lib/passkey-store';
import { unusedRecoveryCodeCount } from '@/lib/recovery-codes';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const passkeys = listPasskeys().map((p) => ({
    id: p.id,
    label: p.label,
    createdAt: p.createdAt,
    lastUsedAt: p.lastUsedAt,
  }));

  const passwordLoginEnabled = isPasswordLoginEnabled();
  const disableGuard = canDisablePasswordLogin();

  return json({
    passkeys,
    passwordLoginEnabled,
    unusedRecoveryCodes: unusedRecoveryCodeCount(),
    canDisablePasswordLogin: disableGuard.ok,
    disablePasswordReason: disableGuard.reason ?? null,
  });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('Invalid request', 400);
  }

  const enabled =
    typeof body === 'object' &&
    body !== null &&
    'passwordLoginEnabled' in body &&
    typeof (body as { passwordLoginEnabled: unknown }).passwordLoginEnabled ===
      'boolean'
      ? (body as { passwordLoginEnabled: boolean }).passwordLoginEnabled
      : null;

  if (enabled === null) {
    return errorJson('Invalid request', 400);
  }

  if (!enabled) {
    const guard = canDisablePasswordLogin();
    if (!guard.ok) {
      return errorJson(guard.reason ?? 'Cannot disable password login', 400);
    }
  }

  setPasswordLoginEnabled(enabled);
  return json({ ok: true, passwordLoginEnabled: enabled });
}
