const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 10;
// Ceiling across all IPs per endpoint, so spoofed X-Forwarded-For values
// (fresh fake IP per request) still trip a limit.
const MAX_FAILURES_GLOBAL = 100;

type Entry = { failures: number[] };

const globalForRl = globalThis as unknown as {
  __pwRateLimit?: Map<string, Entry>;
};
const store = (globalForRl.__pwRateLimit ??= new Map());

function prune(entry: Entry, now: number) {
  entry.failures = entry.failures.filter((t) => now - t < WINDOW_MS);
}

function bucketSize(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  prune(entry, Date.now());
  return entry.failures.length;
}

function record(key: string) {
  const now = Date.now();
  const entry = store.get(key) ?? { failures: [] };
  prune(entry, now);
  entry.failures.push(now);
  store.set(key, entry);
}

/**
 * True if this IP (or the endpoint globally) has exhausted its password
 * attempts and should get a 429. `scope` identifies the endpoint.
 */
export function isRateLimited(scope: string, ip: string): boolean {
  return (
    bucketSize(`${scope}:ip:${ip}`) >= MAX_FAILURES_PER_IP ||
    bucketSize(`${scope}:global`) >= MAX_FAILURES_GLOBAL
  );
}

export function recordFailure(scope: string, ip: string): void {
  record(`${scope}:ip:${ip}`);
  record(`${scope}:global`);
}

export function clearFailures(scope: string, ip: string): void {
  // Only the per-IP bucket; the global ceiling keeps its history.
  store.delete(`${scope}:ip:${ip}`);
}

const globalForWrites = globalThis as unknown as {
  __writeRateLimit?: Map<string, number[]>;
};
const writeStore = (globalForWrites.__writeRateLimit ??= new Map());

/** In-memory write counter per scope+IP (likes, visitor POST, etc.). */
export function writeAllowed(
  scope: string,
  ip: string,
  max: number,
  windowMs: number,
): boolean {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const times = (writeStore.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (times.length >= max) {
    writeStore.set(key, times);
    return false;
  }
  times.push(now);
  writeStore.set(key, times);
  return true;
}

export function ipFromRequest(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // The trusted reverse proxy APPENDS the real client IP as the last
    // entry; earlier entries are attacker-controllable.
    const parts = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts[parts.length - 1] ?? 'unknown';
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}
