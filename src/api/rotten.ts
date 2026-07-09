import type { RtRating } from "@/types";
import { createCache } from "@/utils/cache";
import { gmGet } from "@/utils/request";

const rottenCache = createCache<NonNullable<RtRating>>(
  "dp:rotten-cache",
  7 * 24 * 60 * 60 * 1000
);

/* ── RT Slug Construction ──────────────────────────── */

const toSlug = (title: string): string =>
  title
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036F]/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "_")
    .replaceAll(/^_|_$/gu, "");

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
      ? Math.trunc(Number(criticsRaw))
      : criticsRaw;
  const audienceScore =
    typeof audienceRaw === "string"
      ? Math.trunc(Number(audienceRaw))
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
  const cached = rottenCache.get(key);
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
        rottenCache.set(key, rating);
        return rating;
      }
    } catch {
      /* continue to fallback URL */
    }
  }
  return null;
};

export { fetchRtRating };
