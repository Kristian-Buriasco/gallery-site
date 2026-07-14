import { isPasswordLoginEnabled } from '@/lib/admin-auth-settings';
import { passkeyCount } from '@/lib/passkey-store';
import { json } from '@/lib/api';

export async function GET() {
  return json({
    passwordLoginEnabled: isPasswordLoginEnabled(),
    hasPasskeys: passkeyCount() > 0,
  });
}
