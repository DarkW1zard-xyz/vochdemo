type CacheEntry = {
  value: string;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 60_000;
const MAX_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();

const pruneExpired = () => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
};

const enforceLimit = () => {
  if (cache.size <= MAX_ENTRIES) return;
  const overflow = cache.size - MAX_ENTRIES;
  const keys = cache.keys();
  for (let i = 0; i < overflow; i += 1) {
    const key = keys.next().value;
    if (!key) break;
    cache.delete(key);
  }
};

export const getCachedJson = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCachedJson = (key: string, value: string, ttlMs = DEFAULT_TTL_MS) => {
  pruneExpired();
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
  enforceLimit();
};
