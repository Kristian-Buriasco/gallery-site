import bcrypt from 'bcryptjs';
import { adminPasswordHash } from '@/lib/env';
import { getAdminSession } from '@/lib/session';
import {
  clearFailures,
  ipFromRequest,
  isRateLimited,
  recordFailure,
} from '@/lib/rate-limit';
import { errorJson, json } from '@/lib/api';

const RL_SCOPE = 'admin-login';

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  if (isRateLimited(RL_SCOPE, ip)) {
    return errorJson('Too many attempts. Try again later.', 429);
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return errorJson('Invalid request', 400);
  }
  if (typeof password !== 'string' || !adminPasswordHash()) {
    recordFailure(RL_SCOPE, ip);
    return errorJson('Invalid password', 401);
  }

  const ok = await bcrypt.compare(password, adminPasswordHash());
  if (!ok) {
    recordFailure(RL_SCOPE, ip);
    return errorJson('Invalid password', 401);
  }

  clearFailures(RL_SCOPE, ip);
  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();
  return json({ ok: true });
}
