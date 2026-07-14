import { getSetting, setSetting } from './settings';
import { passkeyCount } from './passkey-store';
import { unusedRecoveryCodeCount } from './recovery-codes';

const PASSWORD_LOGIN_KEY = 'passwordLoginEnabled';

export function isPasswordLoginEnabled(): boolean {
  const value = getSetting(PASSWORD_LOGIN_KEY);
  return value === null || value === 'true';
}

export function setPasswordLoginEnabled(enabled: boolean): void {
  setSetting(PASSWORD_LOGIN_KEY, enabled ? 'true' : 'false');
}

export function canDisablePasswordLogin(): {
  ok: boolean;
  reason?: string;
} {
  if (passkeyCount() < 1) {
    return {
      ok: false,
      reason: 'Add at least one passkey before disabling password login.',
    };
  }
  if (unusedRecoveryCodeCount() < 1) {
    return {
      ok: false,
      reason:
        'Keep at least one unused recovery code before disabling password login.',
    };
  }
  return { ok: true };
}

export function canDeletePasskey(): { ok: boolean; reason?: string } {
  if (isPasswordLoginEnabled()) return { ok: true };
  if (passkeyCount() <= 1) {
    return {
      ok: false,
      reason:
        'Cannot remove the last passkey while password login is disabled.',
    };
  }
  return { ok: true };
}
