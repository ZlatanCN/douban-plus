import type { ImdbRating } from "@/modules/subject/domain";
import { createCache } from "@/shared/utils/cache";
import { gmPost } from "@/shared/utils/request";

import { parseResponse, parseSeasonRating } from "./imdb-parsers";
import type { ParsedResponse } from "./imdb-parsers";

const imdbCache = createCache<{
  rating: NonNullable<ImdbRating>;
  title: string;
}>("dp:imdb-cache", 30 * 24 * 60 * 60 * 1000);

/* ── GraphQL Queries ────────────────────────────────── */

/** First query: get title info + parent series id (if episode). */
const GRAPHQL_QUERY = `query GetRating($id: ID!) {
  title(id: $id) {
    id
    titleText { text }
    ratingsSummary { aggregateRating voteCount }
    series {
      series {
        id
        titleText { text }
      }
    }
  }
}`;

/** Second query: get all episode ratings for a specific season. */
const SEASON_EPISODES_QUERY = `query GetSeasonEpisodes($id: ID!, $season: String!) {
  title(id: $id) {
    episodes {
      episodes(first: 50, filter: {includeSeasons: [$season]}) {
        edges {
          node {
            ratingsSummary { aggregateRating voteCount }
          }
        }
      }
    }
  }
}`;

type FetchImdbResult = {
  rating: ImdbRating | null;
  title: string | null;
};

const IMDB_GRAPHQL_URL = "https://graphql.imdb.com/";
const IMDB_REFERER = "https://www.imdb.com/";
const IMDB_HEADERS = { "Content-Type": "application/json" };

/** Build a cache key scoped to series + season, e.g. "tt0944947-s05". */
const seasonCacheKey = (seriesId: string, season: number): string =>
  `${seriesId}-s${String(season).padStart(2, "0")}`;

const postGraphQL = (
  query: string,
  variables: Record<string, unknown>
): Promise<string> =>
  gmPost(
    IMDB_GRAPHQL_URL,
    JSON.stringify({ query, variables }),
    IMDB_REFERER,
    IMDB_HEADERS
  );

/** First pass: fetch title info + detect whether the tconst is an episode. */
const fetchTitleInfo = async (
  imdbId: string
): Promise<ParsedResponse | null> => {
  try {
    const json = await postGraphQL(GRAPHQL_QUERY, { id: imdbId });
    const parsed = parseResponse(json);
    return "error" in parsed ? null : parsed;
  } catch (error) {
    console.warn("[IMDB] fetch FAILED for", imdbId, error);
    return null;
  }
};

/** Second pass: fetch all episode ratings for a season, return vote-weighted average. */
const fetchSeasonRating = async (
  seriesId: string,
  season: number
): Promise<{ rating: NonNullable<ImdbRating> } | null> => {
  try {
    const json = await postGraphQL(SEASON_EPISODES_QUERY, {
      id: seriesId,
      season: String(season),
    });
    return parseSeasonRating(json);
  } catch {
    console.warn("[IMDB] season episodes query failed, falling back");
    return null;
  }
};

/**
 * Resolve an IMDb rating for a title (and optionally a specific season of a
 * series/episode). Two-stage GraphQL: first pass gets title info + series
 * linkage; if a season is requested, a second pass averages episode ratings.
 * Falls back to the direct title rating when the season pass is skipped or
 * fails. Results are cached per imdbId and per series-season.
 */
const fetchImdbRating = async (
  imdbId: string,
  season?: number
): Promise<FetchImdbResult> => {
  if (!imdbId) {
    return { rating: null, title: null };
  }

  const cached = imdbCache.get(imdbId);
  if (cached) {
    return { rating: cached.rating, title: cached.title };
  }

  const titleInfo = await fetchTitleInfo(imdbId);
  if (!titleInfo) {
    return { rating: null, title: null };
  }

  const { aggregateRating, voteCount, titleText, seriesInfo } = titleInfo;
  const seriesIdForSeason = seriesInfo?.id ?? (season ? imdbId : null);

  if (season && seriesIdForSeason) {
    const sKey = seasonCacheKey(seriesIdForSeason, season);
    const sCached = imdbCache.get(sKey);
    if (sCached) {
      return { rating: sCached.rating, title: sCached.title };
    }
    const seasonResult = await fetchSeasonRating(seriesIdForSeason, season);
    if (seasonResult) {
      const title = seriesInfo?.titleText ?? titleText ?? "";
      imdbCache.set(sKey, { rating: seasonResult.rating, title });
      return { rating: seasonResult.rating, title };
    }
  }

  if (typeof aggregateRating === "number" && typeof voteCount === "number") {
    const rating: NonNullable<ImdbRating> = {
      count: voteCount,
      score: aggregateRating,
    };
    const title = typeof titleText === "string" ? titleText : "";
    imdbCache.set(imdbId, { rating, title });
    return { rating, title };
  }

  return { rating: null, title: titleText };
};

export { fetchImdbRating };
export type { FetchImdbResult };
