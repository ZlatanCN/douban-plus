import { createRatingFetcher } from "@/modules/subject/api/rating-fetcher";
import type { RtRating } from "@/modules/subject/domain";
import { createCache } from "@/shared/utils/cache";

const rottenCache = createCache<NonNullable<RtRating>>(
  "dp:rotten-cache",
  7 * 24 * 60 * 60 * 1000
);

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

const fetchRtRating = createRatingFetcher<RtRating>({
  cache: rottenCache,
  parse: parseRtPage,
  referer: "https://www.rottentomatoes.com/",
  slugSeparator: "_",
  urls: ({ isTV, season, slug, year }) => {
    if (isTV) {
      return season
        ? [
            `https://www.rottentomatoes.com/tv/${slug}/s${String(season).padStart(2, "0")}`,
            `https://www.rottentomatoes.com/tv/${slug}`,
          ]
        : [`https://www.rottentomatoes.com/tv/${slug}`];
    }
    return year
      ? [
          `https://www.rottentomatoes.com/m/${slug}_${year}`,
          `https://www.rottentomatoes.com/m/${slug}`,
        ]
      : [`https://www.rottentomatoes.com/m/${slug}`];
  },
});

export { fetchRtRating };
