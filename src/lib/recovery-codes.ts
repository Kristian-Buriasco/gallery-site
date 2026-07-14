import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb, schema } from '@/db';

const CODE_COUNT = 10;
const BCRYPT_ROUNDS = 10;

function generateOneCode(): string {
  const bytes = crypto.randomBytes(5);
  const raw = bytes.toString('hex').toUpperCase().slice(0, 10);
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

/** Normalize user input to XXXXX-XXXXX form when possible. */
export function normalizeRecoveryCode(input: string): string {
  const trimmed = input.trim();
  const cleaned = trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return trimmed.toUpperCase();
}

export function unusedRecoveryCodeCount(): number {
  const rows = getDb()
    .select({ id: schema.recoveryCodes.id })
    .from(schema.recoveryCodes)
    .where(isNull(schema.recoveryCodes.usedAt))
    .all();
  return rows.length;
}

/** Replace all recovery codes; returns plaintext codes (show once). */
export async function regenerateRecoveryCodes(): Promise<string[]> {
  const db = getDb();
  db.delete(schema.recoveryCodes).run();

  const codes: string[] = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    codes.push(generateOneCode());
  }

  for (const code of codes) {
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    db.insert(schema.recoveryCodes)
      .values({ id: nanoid(), codeHash })
      .run();
  }

  return codes;
}

/** Verify a recovery code; marks used on success. Returns false on any failure. */
export async function verifyRecoveryCode(code: string): Promise<boolean> {
  const normalized = normalizeRecoveryCode(code);
  const rows = getDb()
    .select()
    .from(schema.recoveryCodes)
    .where(isNull(schema.recoveryCodes.usedAt))
    .all();

  for (const row of rows) {
    const match = await bcrypt.compare(normalized, row.codeHash);
    if (match) {
      getDb()
        .update(schema.recoveryCodes)
        .set({ usedAt: Date.now() })
        .where(eq(schema.recoveryCodes.id, row.id))
        .run();
      return true;
    }
  }
  return false;
}
