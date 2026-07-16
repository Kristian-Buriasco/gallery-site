import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { nanoid } from 'nanoid';
import { errorJson, json } from '@/lib/api';
import { insertPasskey } from '@/lib/passkey-store';
import { consumeCollabRegisterChallenge } from '@/lib/passkey-challenge';
import { expectedOrigin, rpId } from '@/lib/webauthn-config';
import { consumeInvite, markCollaboratorLogin } from '@/lib/collaborators';
import { issueAdminSession } from '@/lib/session';
import { logAdmin } from '@/lib/audit-log';
import {
  ipFromRequest,
  isRateLimited,
  recordFailure,
  clearFailures,
  PASSKEY_CHALLENGE_RL,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const RL_SCOPE = 'collab-register-verify';
const LABEL_MAX = 100;

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  if (isRateLimited(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL)) {
    return errorJson('Too many attempts. Try again later.', 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Invalid request', 400);
  }
  if (typeof body !== 'object' || body === null) {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Invalid request', 400);
  }
  const { response, token, label } = body as {
    response?: RegistrationResponseJSON;
    token?: unknown;
    label?: unknown;
  };
  if (!response || typeof token !== 'string' || !token) {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Invalid request', 400);
  }
  const trimmedLabel =
    typeof label === 'string' && label.trim() ? label.trim().slice(0, LABEL_MAX) : 'Collaborator passkey';

  const challengeData = await consumeCollabRegisterChallenge();
  if (!challengeData) {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Registration challenge expired or missing', 400);
  }

  // Consume (mark used) only now, on successful verify path start.
  const invite = consumeInvite(token);
  if (!invite || invite.collaboratorId !== challengeData.collaboratorId) {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Invite is invalid, expired, or already used', 400);
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: expectedOrigin(),
      expectedRPID: rpId(),
      requireUserVerification: true,
    });
  } catch {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Passkey verification failed', 400);
  }

  if (!verification.verified || !verification.registrationInfo) {
    recordFailure(RL_SCOPE, ip, PASSKEY_CHALLENGE_RL);
    return errorJson('Passkey verification failed', 400);
  }

  const { credential } = verification.registrationInfo;
  const transports =
    credential.transports && credential.transports.length > 0
      ? JSON.stringify(credential.transports)
      : null;

  insertPasskey({
    id: nanoid(),
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    transports,
    label: trimmedLabel,
    collaboratorId: invite.collaboratorId,
  });

  clearFailures(RL_SCOPE, ip);
  markCollaboratorLogin(invite.collaboratorId);
  await issueAdminSession(
    { userAgent: req.headers.get('user-agent'), ip },
    { role: 'collaborator', collaboratorId: invite.collaboratorId },
  );

  logAdmin('collaborator.onboarded', {
    targetType: 'collaborator',
    targetId: invite.collaboratorId,
    summary: `Collaborator completed passkey onboarding`,
    actorType: 'collaborator',
    actorId: invite.collaboratorId,
  });

  return json({ ok: true });
}
