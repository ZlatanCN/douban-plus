import type { ImdbRating } from "@/modules/subject/domain";
import { createCache } from "@/shared/utils/cache";
import { gmPost } from "@/shared/utils/request";

import { parseResponse, parseSeasonRating } from "./parsers";
import type { ParsedResponse } from "./parsers";

const imdbCache = createCache<{
  rating: NonNullable<ImdbRating>;
  sourceUrl: string;
  title: string;
}>("dp:imdb-cache-v3", 30 * 24 * 60 * 60 * 1000);

/* ── GraphQL Queries ────────────────────────────────── */

/** First query: get title info + parent series id (if episode). */
const GRAPHQL_QUERY = `query GetRating($id: ID!) {
  title(id: $id) {
    id
    titleText { text }
    titleType { id }
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
  sourceUrl: string | null;
  title: string | null;
};

const IMDB_GRAPHQL_URL = "https://graphql.imdb.com/";
const IMDB_REFERER = "https://www.imdb.com/";
const IMDB_HEADERS = { "Content-Type": "application/json" };

/** Cache by requested title and season, e.g. "tt0944947-s05". */
const seasonCacheKey = (titleId: string, season: number): string =>
  `${titleId}-s${String(season).padStart(2, "0")}`;

const imdbTitleUrl = (titleId: string): string =>
  `https://www.imdb.com/title/${encodeURIComponent(titleId)}/`;

const imdbSeasonUrl = (seriesId: string, season: number): string =>
  `${imdbTitleUrl(seriesId)}episodes/?season=${season}`;

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

/** Fetch episode ratings for a season and return their vote-weighted average. */
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
    console.warn("[IMDB] season episodes query failed");
    return null;
  }
};

/**
 * Resolve an IMDb rating for a title (and optionally a specific season of a
 * series/episode). Season ratings are computed from that season's episodes;
 * when the season data is unavailable, no direct title rating is substituted.
 * Results are cached separately for direct titles and requested seasons.
 */
const fetchImdbRating = async (
  imdbId: string,
  season?: number
): Promise<FetchImdbResult> => {
  if (!imdbId) {
    return { rating: null, sourceUrl: null, title: null };
  }

  if (season !== undefined) {
    const cacheKey = seasonCacheKey(imdbId, season);
    const cachedSeason = imdbCache.get(cacheKey);
    if (cachedSeason) {
      return {
        rating: cachedSeason.rating,
        sourceUrl: cachedSeason.sourceUrl,
        title: cachedSeason.title,
      };
    }

    const titleInfo = await fetchTitleInfo(imdbId);
    if (!titleInfo) {
      return { rating: null, sourceUrl: null, title: null };
    }

    const { titleText, seriesInfo } = titleInfo;
    const seriesId =
      seriesInfo?.id ?? (titleInfo.titleTypeId === "tvSeries" ? imdbId : null);
    if (!seriesId) {
      return { rating: null, sourceUrl: null, title: titleText };
    }
    const seasonResult = await fetchSeasonRating(seriesId, season);
    const title = seriesInfo?.titleText ?? titleText;
    const sourceUrl = imdbSeasonUrl(seriesId, season);
    if (!seasonResult) {
      return { rating: null, sourceUrl, title };
    }

    const cacheTitle = title ?? "";
    imdbCache.set(cacheKey, {
      rating: seasonResult.rating,
      sourceUrl,
      title: cacheTitle,
    });
    return { rating: seasonResult.rating, sourceUrl, title: cacheTitle };
  }

  const cachedTitle = imdbCache.get(imdbId);
  if (cachedTitle) {
    return {
      rating: cachedTitle.rating,
      sourceUrl: cachedTitle.sourceUrl,
      title: cachedTitle.title,
    };
  }

  const titleInfo = await fetchTitleInfo(imdbId);
  if (!titleInfo) {
    return { rating: null, sourceUrl: null, title: null };
  }

  const { aggregateRating, voteCount, titleText } = titleInfo;
  if (typeof aggregateRating === "number" && typeof voteCount === "number") {
    const rating: NonNullable<ImdbRating> = {
      count: voteCount,
      score: aggregateRating,
    };
    const title = typeof titleText === "string" ? titleText : "";
    const sourceUrl = imdbTitleUrl(imdbId);
    imdbCache.set(imdbId, { rating, sourceUrl, title });
    return { rating, sourceUrl, title };
  }

  return { rating: null, sourceUrl: imdbTitleUrl(imdbId), title: titleText };
};

export { fetchImdbRating };
export type { FetchImdbResult };
