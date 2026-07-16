import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionSecret } from './env';
import { CHALLENGE_TTL_MS } from './webauthn-config';

const CHALLENGE_TTL_SECONDS = Math.ceil(CHALLENGE_TTL_MS / 1000);

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function challengeOptions(cookieName: string): SessionOptions {
  return {
    cookieName,
    password: sessionSecret(),
    ttl: CHALLENGE_TTL_SECONDS,
    cookieOptions: { ...baseCookieOptions, maxAge: CHALLENGE_TTL_SECONDS },
  };
}

export interface RegisterChallengeData {
  challenge?: string;
  challengeAt?: number;
}

export interface AuthChallengeData {
  challenge?: string;
  challengeAt?: number;
}

export async function getRegisterChallengeSession(): Promise<
  IronSession<RegisterChallengeData>
> {
  return getIronSession<RegisterChallengeData>(
    await cookies(),
    challengeOptions('webauthn_register'),
  );
}

export async function getAuthChallengeSession(): Promise<
  IronSession<AuthChallengeData>
> {
  return getIronSession<AuthChallengeData>(
    await cookies(),
    challengeOptions('webauthn_auth'),
  );
}

export async function storeRegisterChallenge(challenge: string): Promise<void> {
  const session = await getRegisterChallengeSession();
  session.challenge = challenge;
  session.challengeAt = Date.now();
  await session.save();
}

export async function consumeRegisterChallenge(): Promise<string | null> {
  const session = await getRegisterChallengeSession();
  const challenge = session.challenge;
  const at = session.challengeAt;
  session.challenge = undefined;
  session.challengeAt = undefined;
  await session.save();
  if (!challenge || !at || Date.now() - at > CHALLENGE_TTL_MS) return null;
  return challenge;
}

export interface CollabRegisterChallengeData {
  challenge?: string;
  challengeAt?: number;
  collaboratorId?: string;
}

/** Separate cookie from the owner registration ceremony, scoped to a collaborator. */
export async function getCollabRegisterChallengeSession(): Promise<
  IronSession<CollabRegisterChallengeData>
> {
  return getIronSession<CollabRegisterChallengeData>(
    await cookies(),
    challengeOptions('webauthn_collab_register'),
  );
}

export async function storeCollabRegisterChallenge(
  challenge: string,
  collaboratorId: string,
): Promise<void> {
  const session = await getCollabRegisterChallengeSession();
  session.challenge = challenge;
  session.challengeAt = Date.now();
  session.collaboratorId = collaboratorId;
  await session.save();
}

export async function consumeCollabRegisterChallenge(): Promise<{
  challenge: string;
  collaboratorId: string;
} | null> {
  const session = await getCollabRegisterChallengeSession();
  const challenge = session.challenge;
  const at = session.challengeAt;
  const collaboratorId = session.collaboratorId;
  session.challenge = undefined;
  session.challengeAt = undefined;
  session.collaboratorId = undefined;
  await session.save();
  if (!challenge || !at || !collaboratorId || Date.now() - at > CHALLENGE_TTL_MS) return null;
  return { challenge, collaboratorId };
}

export async function storeAuthChallenge(challenge: string): Promise<void> {
  const session = await getAuthChallengeSession();
  session.challenge = challenge;
  session.challengeAt = Date.now();
  await session.save();
}

export async function consumeAuthChallenge(): Promise<string | null> {
  const session = await getAuthChallengeSession();
  const challenge = session.challenge;
  const at = session.challengeAt;
  session.challenge = undefined;
  session.challengeAt = undefined;
  await session.save();
  if (!challenge || !at || Date.now() - at > CHALLENGE_TTL_MS) return null;
  return challenge;
}
