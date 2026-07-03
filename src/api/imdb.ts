import type { ImdbRating } from "../types";
import { gmPost } from "../utils/request";

/* ── Persistent Cache (localStorage-backed) ──────────── */

const TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "dp:imdb-cache";

type CacheEntry = { expiresAt: number; rating: NonNullable<ImdbRating> };

const loadCache = (): Map<string, CacheEntry> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Map();
    }
    const parsed = JSON.parse(raw) as [string, CacheEntry][];
    const map = new Map<string, CacheEntry>(parsed);
    const now = Date.now();
    for (const [key, entry] of map) {
      if (now > entry.expiresAt) {
        map.delete(key);
      }
    }

    return map;
  } catch {
    return new Map();
  }
};

const persistCache = (cache: Map<string, CacheEntry>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cache.entries()]));
  } catch {
    /* quota exceeded or unavailable */
  }
};

/* Read from localStorage on every access — no module-level cache
 * so tests can clear localStorage for proper isolation. */
const cacheGet = (id: string): NonNullable<ImdbRating> | undefined => {
  const entries = loadCache();
  const entry = entries.get(id);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    entries.delete(id);
    persistCache(entries);
    return undefined;
  }
  return entry.rating;
};

const cacheSet = (id: string, rating: NonNullable<ImdbRating>): void => {
  const entries = loadCache();
  entries.set(id, { expiresAt: Date.now() + TTL_MS, rating });
  persistCache(entries);
};

/* ── GraphQL Query ──────────────────────────────────── */

const GRAPHQL_QUERY = `query GetRating($id: ID!) {
  title(id: $id) {
    ratingsSummary {
      aggregateRating
      voteCount
    }
  }
}`;

const fetchImdbRating = async (imdbId: string): Promise<ImdbRating | null> => {
  if (!imdbId) {
    return null;
  }

  const cached = cacheGet(imdbId);
  if (cached) {
    return cached;
  }

  try {
    const json = await gmPost(
      "https://graphql.imdb.com/",
      JSON.stringify({ query: GRAPHQL_QUERY, variables: { id: imdbId } }),
      "https://www.imdb.com/",
      { "Content-Type": "application/json" }
    );
    const parsed = JSON.parse(json) as {
      data?: {
        title?: {
          ratingsSummary?: { aggregateRating: number; voteCount: number };
        };
      };
      errors?: unknown;
    };

    if (parsed.errors) {
      return null;
    }

    const aggregateRating =
      parsed?.data?.title?.ratingsSummary?.aggregateRating;
    const voteCount = parsed?.data?.title?.ratingsSummary?.voteCount;
    if (typeof aggregateRating === "number" && typeof voteCount === "number") {
      const rating: NonNullable<ImdbRating> = {
        count: voteCount,
        score: aggregateRating,
      };
      cacheSet(imdbId, rating);
      return rating;
    }

    return null;
  } catch (error) {
    console.warn("[IMDB] fetch FAILED for", imdbId, error);
    return null;
  }
};

export { fetchImdbRating };
