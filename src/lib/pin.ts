import bcrypt from 'bcryptjs';

// 6 digits (1e6 keyspace). A 4-digit PIN (1e4) is brute-forceable within the
// rate-limit budget in ~days; 6 digits pushes that to ~a year while staying
// easy to share verbally (like a one-time code).
const PIN_MIN = 6;
const PIN_MAX = 6;

export function normalizePin(input: string): string {
  return input.replace(/\D/g, '').slice(0, PIN_MAX);
}

export function isValidPinFormat(pin: string): boolean {
  const n = normalizePin(pin);
  return n.length >= PIN_MIN && n.length <= PIN_MAX;
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(normalizePin(pin), 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(normalizePin(pin), hash);
}

/**
 * Gallery requires an access gate (password or optional PIN). A configured
 * password always gates — even if the PIN toggle was flipped on without a PIN
 * saved yet — so enabling PIN mode can never silently drop existing password
 * protection. `galleryUsesPin` decides which credential the gate accepts.
 */
export function galleryRequiresAccess(gallery: {
  passwordHash: string | null;
  pinEnabled: boolean;
  pinHash: string | null;
}): boolean {
  if (gallery.pinEnabled && gallery.pinHash) return true;
  if (gallery.passwordHash) return true;
  return false;
}

export function galleryUsesPin(gallery: {
  pinEnabled: boolean;
  pinHash: string | null;
}): boolean {
  return gallery.pinEnabled && !!gallery.pinHash;
}
