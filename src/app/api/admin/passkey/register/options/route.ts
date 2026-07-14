import { generateRegistrationOptions } from '@simplewebauthn/server';
import { requireAdmin, json } from '@/lib/api';
import { listPasskeys } from '@/lib/passkey-store';
import { storeRegisterChallenge } from '@/lib/passkey-challenge';
import {
  ADMIN_USER_ID,
  ADMIN_USER_NAME,
  rpId,
  rpName,
} from '@/lib/webauthn-config';

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const existing = listPasskeys();
  const options = await generateRegistrationOptions({
    rpName: rpName(),
    rpID: rpId(),
    userName: ADMIN_USER_NAME,
    userDisplayName: 'Admin',
    userID: ADMIN_USER_ID,
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports
        ? (JSON.parse(c.transports) as AuthenticatorTransport[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await storeRegisterChallenge(options.challenge);
  return json(options);
}
