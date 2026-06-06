/**
 * Simple in-memory sliding-window rate limiter for socket events.
 * Per-process (not distributed), which is fine for a single-node setup.
 */
const buckets = new Map();

/**
 * Returns true if `key` has exceeded `max` events within `windowMs`.
 * Records the event when it is allowed.
 */
export const isRateLimited = (key, max, windowMs) => {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }

  hits.push(now);
  buckets.set(key, hits);
  return false;
};

// Periodically drop stale buckets to keep memory bounded.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of buckets) {
    const recent = hits.filter((t) => now - t < 60000);
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
  }
}, 60000);
cleanup.unref();
