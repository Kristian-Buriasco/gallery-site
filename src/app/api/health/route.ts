import { getDb } from '@/db';
import { json } from '@/lib/api';

/** Unauthenticated health probe for monitors — leaks nothing beyond ok/fail. */
export async function GET() {
  try {
    getDb().run('SELECT 1');
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 500);
  }
}
