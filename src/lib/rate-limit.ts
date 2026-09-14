/** Process-local fixed-window limiter for anonymous form endpoints. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function allowRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1_000) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** A stable, privacy-preserving-enough key for process-local request limits. */
export function clientAddress(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
