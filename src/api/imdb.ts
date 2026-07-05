import type { ImdbRating } from "../types";
import { createCache } from "../utils/cache";
import { gmPost } from "../utils/request";

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

type ParsedResponse = {
  titleText: string | null;
  aggregateRating: number | undefined;
  voteCount: number | undefined;
  /** When the queried tconst is an episode, the parent series id + title.
   *  Null for movies and series-level tconsts. */
  seriesInfo: {
    id: string;
    titleText: string;
  } | null;
};

type ParsedRaw = {
  data?: {
    title?: {
      id: string;
      titleText?: { text: string };
      ratingsSummary?: { aggregateRating: number; voteCount: number };
      series?: {
        series?: {
          id: string;
          titleText?: { text: string };
        };
      } | null;
    };
  };
  errors?: unknown;
};

const extractTitleFields = (parsed: ParsedRaw): ParsedResponse | null => {
  if (parsed.errors) {
    return null;
  }
  const title = parsed?.data?.title;
  const seriesNested = title?.series?.series;
  const seriesInfo = seriesNested?.id
    ? {
        id: seriesNested.id,
        titleText: seriesNested.titleText?.text ?? title?.titleText?.text ?? "",
      }
    : null;
  return {
    aggregateRating: title?.ratingsSummary?.aggregateRating,
    seriesInfo: seriesInfo as ParsedResponse["seriesInfo"],
    titleText: title?.titleText?.text ?? null,
    voteCount: title?.ratingsSummary?.voteCount,
  };
};

const parseResponse = (json: string): ParsedResponse | { error: true } => {
  try {
    const parsed = JSON.parse(json) as ParsedRaw;
    const result = extractTitleFields(parsed);
    return result ?? { error: true as const };
  } catch {
    return { error: true as const };
  }
};

/** Parse the season-episodes response and compute a vote-weighted average rating. */
const parseSeasonRating = (
  json: string
): { rating: NonNullable<ImdbRating> } | null => {
  try {
    const parsed = JSON.parse(json) as {
      data?: {
        title?: {
          episodes?: {
            episodes?: {
              edges?: {
                node?: {
                  ratingsSummary?: {
                    aggregateRating: number | null;
                    voteCount: number | null;
                  };
                };
              }[];
            };
          };
        };
      };
    };

    const edges = parsed?.data?.title?.episodes?.episodes?.edges;
    if (!edges || edges.length === 0) {
      return null;
    }

    let totalWeighted = 0;
    let totalVotes = 0;
    for (const edge of edges) {
      const rs = edge?.node?.ratingsSummary;
      if (
        rs &&
        typeof rs.aggregateRating === "number" &&
        typeof rs.voteCount === "number" &&
        rs.voteCount > 0
      ) {
        totalWeighted += rs.aggregateRating * rs.voteCount;
        totalVotes += rs.voteCount;
      }
    }

    if (totalVotes === 0) {
      return null;
    }

    return {
      rating: {
        count: totalVotes,
        score: Math.round((totalWeighted / totalVotes) * 10) / 10,
      },
    };
  } catch {
    return null;
  }
};

/** Build a cache key scoped to series + season, e.g. "tt0944947-s05". */
const seasonCacheKey = (seriesId: string, season: number): string =>
  `${seriesId}-s${String(season).padStart(2, "0")}`;

const fetchImdbRating = async (
  imdbId: string,
  season?: number
): Promise<FetchImdbResult> => {
  if (!imdbId) {
    return {
      rating: null,
      title: null,
    };
  }

  // ----- Check cache before HTTP request -----

  const cached = imdbCache.get(imdbId);
  if (cached) {
    return { rating: cached.rating, title: cached.title };
  }

  // ----- First pass: get title info + check if tconst is an episode -----

  let json: string;
  try {
    json = await gmPost(
      "https://graphql.imdb.com/",
      JSON.stringify({ query: GRAPHQL_QUERY, variables: { id: imdbId } }),
      "https://www.imdb.com/",
      { "Content-Type": "application/json" }
    );
  } catch (error) {
    console.warn("[IMDB] fetch FAILED for", imdbId, error);
    return { rating: null, title: null };
  }

  const parsed = parseResponse(json);
  if ("error" in parsed) {
    return { rating: null, title: null };
  }

  const { aggregateRating, voteCount, titleText, seriesInfo } = parsed;

  // ----- Season-level rating (weighted avg of all episode ratings) -----
  //
  //   Fires for BOTH scenarios:
  //   - Episode tconst  (seriesInfo is set) → parent series ID from seriesInfo.id
  //   - Series tconst   (seriesInfo is null, season is provided) → imdbId IS the series
  //   Only skips when season is absent (movie / one-off).

  const seriesIdForSeason = seriesInfo?.id ?? (season ? imdbId : null);
  if (season && seriesIdForSeason) {
    const sKey = seasonCacheKey(seriesIdForSeason, season);
    const sCached = imdbCache.get(sKey);
    if (sCached) {
      return { rating: sCached.rating, title: sCached.title };
    }

    try {
      const sJson = await gmPost(
        "https://graphql.imdb.com/",
        JSON.stringify({
          query: SEASON_EPISODES_QUERY,
          variables: { id: seriesIdForSeason, season: String(season) },
        }),
        "https://www.imdb.com/",
        { "Content-Type": "application/json" }
      );
      const seasonResult = parseSeasonRating(sJson);
      if (seasonResult) {
        const title = seriesInfo?.titleText ?? titleText ?? "";
        imdbCache.set(sKey, { rating: seasonResult.rating, title });
        return { rating: seasonResult.rating, title };
      }
    } catch {
      console.warn("[IMDB] season episodes query failed, falling back");
    }
  }

  // ----- Fallback: use the direct title rating (series / movie / episode) -----

  const effectiveRating = aggregateRating;
  const effectiveCount = voteCount;
  const effectiveTitle = titleText;

  if (
    typeof effectiveRating === "number" &&
    typeof effectiveCount === "number"
  ) {
    const rating: NonNullable<ImdbRating> = {
      count: effectiveCount,
      score: effectiveRating,
    };
    const title = typeof effectiveTitle === "string" ? effectiveTitle : "";
    imdbCache.set(imdbId, { rating, title });
    return { rating, title };
  }

  return { rating: null, title: effectiveTitle };
};

export { fetchImdbRating };
