import { createRatingFetcher } from "@/modules/subject/api/rating-fetcher";
import type { McRating } from "@/modules/subject/domain";
import { createCache } from "@/shared/utils/cache";

const mcCache = createCache<NonNullable<McRating>>(
  "dp:metacritic-cache",
  7 * 24 * 60 * 60 * 1000
);

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
    const score = Math.trunc(Number(String(rating.ratingValue)));
    const reviewCount = Math.trunc(Number(String(rating.reviewCount)));
    if (Number.isNaN(score) || Number.isNaN(reviewCount)) {
      return null;
    }
    return { reviewCount, score };
  } catch {
    return null;
  }
};

const fetchMcRating = createRatingFetcher<McRating>({
  cache: mcCache,
  parse: parseMcPage,
  referer: "https://www.metacritic.com/",
  slugSeparator: "-",
  urls: ({ isTV, season, slug, year }) => {
    if (isTV) {
      const yearSlug = year ? `${slug}-${year}` : slug;
      if (season) {
        return [
          // Priority 1: year-disambiguated slug with exact season
          ...(year
            ? [`https://www.metacritic.com/tv/${yearSlug}/season-${season}`]
            : []),
          // Priority 2: bare slug with exact season (current behaviour)
          `https://www.metacritic.com/tv/${slug}/season-${season}`,
          // Priority 3: year-disambiguated main page (fallback when season-URL fails)
          ...(year ? [`https://www.metacritic.com/tv/${yearSlug}`] : []),
          // Priority 4: bare slug main page
          `https://www.metacritic.com/tv/${slug}`,
        ];
      }
      return year
        ? [
            `https://www.metacritic.com/tv/${yearSlug}`,
            `https://www.metacritic.com/tv/${slug}`,
          ]
        : [`https://www.metacritic.com/tv/${slug}`];
    }
    return year
      ? [
          `https://www.metacritic.com/movie/${slug}-${year}`,
          `https://www.metacritic.com/movie/${slug}`,
        ]
      : [`https://www.metacritic.com/movie/${slug}`];
  },
});

export { fetchMcRating };
