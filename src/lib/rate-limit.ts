/**
 * In-process fixed-window limiter. Enough for a single-node deployment, which
 * is what a modular monolith on-premise install is.
 *
 * ponytail: in-memory only — move to Redis if the app is ever run on more
 * than one node behind a load balancer.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) sweep(now);
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

function sweep(now: number) {
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}
