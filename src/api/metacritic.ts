import type { McRating } from "../types";
import { createCache } from "../utils/cache";
import { gmGet } from "../utils/request";

const mcCache = createCache<NonNullable<McRating>>(
  "dp:metacritic-cache",
  7 * 24 * 60 * 60 * 1000
);

/** Convert a title to a Metacritic-style hyphen slug.
 *  Metacritic uses hyphens (not underscores like RT).
 *  E.g. "The Shawshank Redemption" → "the-shawshank-redemption" */
const toMcSlug = (title: string): string => {
  const slug = title
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036F]/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
  return slug;
};

/** Build a cache key from slug + optional season suffix + optional year suffix.
 *  E.g. "the-wire" or "the-wire-s05" or "true-grit-2010-s00".
 *  Note: MC year-suffixed URLs return 404 for most movies; the year suffix here
 *  is for cache key disambiguation (matches RT pattern for consistency). */
const cacheKey = (slug: string, season?: number, year?: string): string => {
  let key = slug;
  if (year) {
    key = `${key}-${year}`;
  }
  if (season) {
    key = `${key}-s${String(season).padStart(2, "0")}`;
  }
  return key;
};

/** Extract metascore and critic review count from JSON-LD.
 *  Metacritic uses Nuxt.js — no __NEXT_DATA__. The JSON-LD is
 *  server-rendered and contains aggregateRating with ratingValue (0-100)
 *  and reviewCount. User scores are client-side only. */
const parseMcPage = (html: string): McRating | null => {
  const match = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>(?<json>[\s\S]*?)<\/script>/iu
  );
  if (!match?.groups?.json) {
    return null;
  }
  try {
    const data = JSON.parse(match.groups.json.trim());
    const rating = data?.aggregateRating;
    if (rating?.ratingValue === null || rating?.reviewCount === null) {
      return null;
    }
    const score = Number.parseInt(String(rating.ratingValue), 10);
    const reviewCount = Number.parseInt(String(rating.reviewCount), 10);
    if (Number.isNaN(score) || Number.isNaN(reviewCount)) {
      return null;
    }
    return { reviewCount, score };
  } catch {
    return null;
  }
};

/** Fetch Metacritic rating for a movie or TV show.
 *
 *  Attempts URLs in order:
 *    Movies: /movie/{slug}-{year} → /movie/{slug}
 *    TV:     /tv/{slug}/season-{n} → /tv/{slug}
 *
 *  Returns null when all URLs fail or no JSON-LD is found. */
const fetchMcRating = async (
  title: string,
  isTV?: boolean,
  season?: number,
  year?: string
): Promise<McRating | null> => {
  if (!title) {
    return null;
  }

  const slug = toMcSlug(title);
  if (!slug) {
    return null;
  }

  const key = cacheKey(slug, season, year);
  const cached = mcCache.get(key);
  if (cached) {
    return cached;
  }

  const urls: string[] = [];
  if (isTV) {
    if (season) {
      urls.push(`https://www.metacritic.com/tv/${slug}/season-${season}`);
    }
    urls.push(`https://www.metacritic.com/tv/${slug}`);
  } else {
    if (year) {
      urls.push(`https://www.metacritic.com/movie/${slug}-${year}`);
    }
    urls.push(`https://www.metacritic.com/movie/${slug}`);
  }

  for (const url of urls) {
    try {
      // oxlint-disable-next-line no-await-in-loop
      const html = await gmGet(url, "https://www.metacritic.com/");
      const rating = parseMcPage(html);
      if (rating) {
        mcCache.set(key, rating);
        return rating;
      }
    } catch {
      /* continue to fallback URL */
    }
  }
  return null;
};

export { fetchMcRating };
