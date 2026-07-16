import { requireAdmin, json } from '@/lib/api';
import { getStorageSnapshot } from '@/lib/storage-cache';

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const force = new URL(req.url).searchParams.get('refresh') === '1';
  return json(getStorageSnapshot(force));
}
