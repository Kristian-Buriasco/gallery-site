import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { errorJson, json } from '@/lib/api';
import { listPasskeys } from '@/lib/passkey-store';
import { storeAuthChallenge } from '@/lib/passkey-challenge';
import { rpId } from '@/lib/webauthn-config';

export async function POST() {
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
