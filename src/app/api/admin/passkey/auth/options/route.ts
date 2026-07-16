import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { errorJson, json } from '@/lib/api';
import { listPasskeys } from '@/lib/passkey-store';
import { storeAuthChallenge } from '@/lib/passkey-challenge';
import { rpId } from '@/lib/webauthn-config';
import { ipFromRequest, isRateLimited, PASSKEY_CHALLENGE_RL } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  if (isRateLimited('admin-passkey-challenge', ip, PASSKEY_CHALLENGE_RL)) {
    return errorJson('Too many attempts. Try again later.', 429);
  }

  const credentials = listPasskeys();
  if (credentials.length === 0) {
    return errorJson('No passkeys registered', 400);
  }

  const options = await generateAuthenticationOptions({
    rpID: rpId(),
    allowCredentials: credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports
        ? (JSON.parse(c.transports) as AuthenticatorTransport[])
        : undefined,
    })),
    userVerification: 'preferred',
  });

  await storeAuthChallenge(options.challenge);
  return json(options);
}
