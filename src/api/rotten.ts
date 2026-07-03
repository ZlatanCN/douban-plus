import type { RtRating } from "../types";
import { gmGet } from "../utils/request";

/* ── Persistent Cache (localStorage-backed) ──────────── */

const TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "dp:rotten-cache";

type CacheEntry = { expiresAt: number; rating: NonNullable<RtRating> };

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

const cacheGet = (slug: string): NonNullable<RtRating> | undefined => {
  const entries = loadCache();
  const entry = entries.get(slug);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    entries.delete(slug);
    persistCache(entries);
    return undefined;
  }
  return entry.rating;
};

const cacheSet = (slug: string, rating: NonNullable<RtRating>): void => {
  const entries = loadCache();
  entries.set(slug, { expiresAt: Date.now() + TTL_MS, rating });
  persistCache(entries);
};

/* ── RT Slug Construction ──────────────────────────── */

const toSlug = (title: string): string => {
  const slug = title
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036F]/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "_")
    .replaceAll(/^_|_$/gu, "");
  return slug;
};

/** Build a cache key from slug + optional season suffix.
 *  E.g. "game_of_thrones" or "game_of_thrones-s05".
 *  This prevents different seasons from sharing the same cached rating. */
const cacheKey = (slug: string, season?: number): string =>
  season ? `${slug}-s${String(season).padStart(2, "0")}` : slug;

/* ── RT Page HTML Parsing ──────────────────────────── */

type ReviewsData = {
  criticsScore?: {
    score?: string | number;
    certified?: boolean;
    scorePercent?: string;
  };
  audienceScore?: {
    score?: string | number;
    reviewCount?: number;
  };
};

const parseData = (raw: string): { score: number; count: number } | null => {
  const data = JSON.parse(raw) as ReviewsData;
  const criticsScore = data.criticsScore?.score;
  if (criticsScore === undefined || criticsScore === null) {
    return null;
  }
  const score =
    typeof criticsScore === "string"
      ? Number.parseInt(criticsScore, 10)
      : criticsScore;
  if (Number.isNaN(score)) {
    return null;
  }
  return { count: data.audienceScore?.reviewCount ?? 0, score };
};

const parseMediaScorecard = (html: string): RtRating | null => {
  const mc = html.match(
    /<script[^>]*data-json="mediaScorecard"[^>]*>(?<json>.*?)<\/script>/iu
  );
  if (!mc?.groups?.json) {
    return null;
  }
  try {
    const result = parseData(mc.groups.json);
    return result ? { count: result.count, score: result.score } : null;
  } catch {
    return null;
  }
};

const parseRtPage = (html: string): RtRating | null => {
  const match = html.match(
    /<script[^>]*type="application\/json"[^>]*data-json="reviewsData"[^>]*>(?<json>.*?)<\/script>/iu
  );
  if (match?.groups?.json) {
    try {
      const result = parseData(match.groups.json);
      if (result) {
        return { count: result.count, score: result.score };
      }
    } catch {
      /* invalid JSON, try mediaScorecard fallback */
    }
    return null;
  }

  const mcResult = parseMediaScorecard(html);
  if (mcResult) {
    return mcResult;
  }
  return null;
};

/* ── Fetch ─────────────────────────────────────────── */

const fetchRtRating = async (
  title: string,
  isTV?: boolean,
  season?: number
): Promise<RtRating | null> => {
  if (!title) {
    return null;
  }

  const slug = toSlug(title);
  if (!slug) {
    return null;
  }

  const key = cacheKey(slug, season);
  const cached = cacheGet(key);
  if (cached) {
    return cached;
  }

  const urls: string[] = [];
  if (isTV) {
    if (season) {
      urls.push(
        `https://www.rottentomatoes.com/tv/${slug}/s${String(season).padStart(2, "0")}`
      );
    }
    urls.push(`https://www.rottentomatoes.com/tv/${slug}`);
  } else {
    urls.push(`https://www.rottentomatoes.com/m/${slug}`);
  }

  for (const url of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop — sequential fallback
      const html = await gmGet(url, "https://www.rottentomatoes.com/");
      const rating = parseRtPage(html);
      if (rating) {
        cacheSet(key, rating);
        return rating;
      }
    } catch {
      /* continue to fallback URL */
    }
  }
  return null;
};

export { fetchRtRating };
