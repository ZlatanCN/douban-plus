/** Generic localStorage-backed cache with TTL-based expiry. */

interface Cache<T> {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const createCache = <T>(
  storageKey: string,
  ttlMs: number = 24 * 60 * 60 * 1000
): Cache<T> => {
  const load = (): Map<string, CacheEntry<T>> => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return new Map();
      }
      const parsed = JSON.parse(raw) as [string, CacheEntry<T>][];
      return new Map(parsed);
    } catch {
      return new Map();
    }
  };

  const persist = (entries: Map<string, CacheEntry<T>>): void => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...entries.entries()]));
    } catch {
      /* quota exceeded or unavailable */
    }
  };

  return {
    get(key: string): T | undefined {
      const entries = load();
      const entry = entries.get(key);
      if (!entry) {
        return undefined;
      }
      if (Date.now() > entry.expiresAt) {
        entries.delete(key);
        persist(entries);
        return undefined;
      }
      return entry.value;
    },

    set(key: string, value: T): void {
      const entries = load();
      entries.set(key, { expiresAt: Date.now() + ttlMs, value });
      persist(entries);
    },
  };
};

export { createCache, type Cache };
