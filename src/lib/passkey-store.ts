import { eq, asc } from 'drizzle-orm';
import { getDb, schema } from '@/db';

export type PasskeyRow = typeof schema.adminCredentials.$inferSelect;

export function listPasskeys(): PasskeyRow[] {
  return getDb()
    .select()
    .from(schema.adminCredentials)
    .orderBy(asc(schema.adminCredentials.createdAt))
    .all();
}

export function passkeyCount(): number {
  const row = getDb()
    .select({ n: schema.adminCredentials.id })
    .from(schema.adminCredentials)
    .all();
  return row.length;
}

export function getPasskeyByCredentialId(
  credentialId: string,
): PasskeyRow | undefined {
  return getDb()
    .select()
    .from(schema.adminCredentials)
    .where(eq(schema.adminCredentials.credentialId, credentialId))
    .get();
}

export function getPasskeyById(id: string): PasskeyRow | undefined {
  return getDb()
    .select()
    .from(schema.adminCredentials)
    .where(eq(schema.adminCredentials.id, id))
    .get();
}

export function insertPasskey(row: {
  id: string;
  credentialId: string;
  publicKey: Buffer;
  counter: number;
  transports: string | null;
  label: string;
}): void {
  getDb().insert(schema.adminCredentials).values(row).run();
}

export function updatePasskeyAfterAuth(
  id: string,
  counter: number,
  lastUsedAt: number,
): void {
  getDb()
    .update(schema.adminCredentials)
    .set({ counter, lastUsedAt })
    .where(eq(schema.adminCredentials.id, id))
    .run();
}

export function renamePasskey(id: string, label: string): void {
  getDb()
    .update(schema.adminCredentials)
    .set({ label })
    .where(eq(schema.adminCredentials.id, id))
    .run();
}

export function deletePasskey(id: string): void {
  getDb()
    .delete(schema.adminCredentials)
    .where(eq(schema.adminCredentials.id, id))
    .run();
}
