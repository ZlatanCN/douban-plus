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

/** Build a cache key from slug + optional season suffix + optional year suffix.
 *  E.g. "game_of_thrones" or "game_of_thrones-s05" or "pressure_2026".
 *  Year suffix prevents slug collisions between same-named movies from different years. */
const cacheKey = (slug: string, season?: number, year?: string): string => {
  let key = slug;
  if (year) {
    key = `${key}_${year}`;
  }
  if (season) {
    key = `${key}-s${String(season).padStart(2, "0")}`;
  }
  return key;
};

/* ── RT Page HTML Parsing ──────────────────────────── */

type ReviewsData = {
  criticsScore?: {
    score?: string | number;
    certified?: boolean;
    scorePercent?: string;
    ratingCount?: number;
  };
  audienceScore?: {
    score?: string | number;
    reviewCount?: number;
    likedCount?: number;
    notLikedCount?: number;
  };
};

const parseData = (raw: string): RtRating | null => {
  const data = JSON.parse(raw) as ReviewsData;
  const criticsRaw = data.criticsScore?.score;
  const audienceRaw = data.audienceScore?.score;
  if (
    criticsRaw === undefined ||
    criticsRaw === null ||
    audienceRaw === undefined ||
    audienceRaw === null
  ) {
    return null;
  }
  const criticsScore =
    typeof criticsRaw === "string"
      ? Number.parseInt(criticsRaw, 10)
      : criticsRaw;
  const audienceScore =
    typeof audienceRaw === "string"
      ? Number.parseInt(audienceRaw, 10)
      : audienceRaw;
  if (Number.isNaN(criticsScore) || Number.isNaN(audienceScore)) {
    return null;
  }
  return {
    audienceCount:
      (data.audienceScore?.likedCount ?? 0) +
      (data.audienceScore?.notLikedCount ?? 0),
    audienceScore,
    criticsCount: data.criticsScore?.ratingCount ?? 0,
    criticsScore,
  };
};

const parseMediaScorecard = (html: string): RtRating | null => {
  const mc = html.match(
    /<script[^>]*data-json="mediaScorecard"[^>]*>(?<json>[\s\S]*?)<\/script>/iu
  );
  if (!mc?.groups?.json) {
    return null;
  }
  try {
    return parseData(mc.groups.json.trim());
  } catch {
    return null;
  }
};

const parseRtPage = (html: string): RtRating | null => {
  // mediaScorecard has richer data (criticsScore.ratingCount),
  // so try it first. Fall back to reviewsData.
  const msRating = parseMediaScorecard(html);
  if (msRating) {
    return msRating;
  }

  const match = html.match(
    /<script[^>]*type="application\/json"[^>]*data-json="reviewsData"[^>]*>(?<json>[\s\S]*?)<\/script>/iu
  );
  if (match?.groups?.json) {
    try {
      return parseData(match.groups.json.trim());
    } catch {
      /* invalid JSON */
    }
  }
  return null;
};

/* ── Fetch ─────────────────────────────────────────── */

const fetchRtRating = async (
  title: string,
  isTV?: boolean,
  season?: number,
  year?: string
): Promise<RtRating | null> => {
  if (!title) {
    return null;
  }

  const slug = toSlug(title);
  if (!slug) {
    return null;
  }

  const key = cacheKey(slug, season, year);
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
    if (year) {
      urls.push(`https://www.rottentomatoes.com/m/${slug}_${year}`);
    }
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
