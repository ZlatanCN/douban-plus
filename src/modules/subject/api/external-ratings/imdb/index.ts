import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { ImdbRating } from "@/modules/subject/domain";
import { createCache } from "@/shared/utils/cache";
import { gmPost } from "@/shared/utils/request";

import { parseResponse, parseSeasonRating } from "./parsers";
import type { ParsedResponse } from "./parsers";

const imdbCache = createCache<{
  fetchedAt: number;
  rating: NonNullable<ImdbRating>;
  sourceUrl: string;
  title: string;
}>("dp:imdb-cache-v4", 30 * 24 * 60 * 60 * 1000);

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
type OnImdbOutcome = (diagnostic: ExternalRatingDiagnostic) => void;
type TitleInfoResult =
  | { response: ParsedResponse }
  | {
      errorCode: string;
      reason: "cancelled" | "parse-error" | "request-error";
    };
type SeasonRatingResult =
  | { rating: NonNullable<ImdbRating>; status: "rating" }
  | {
      errorCode: string;
      status: "cancelled" | "parse-error" | "request-error";
    }
  | { status: "source-no-rating" };

const IMDB_GRAPHQL_URL = "https://graphql.imdb.com/";
const IMDB_REFERER = "https://www.imdb.com/";
const IMDB_HEADERS = { "Content-Type": "application/json" };

const makeDiagnostic = (
  reason: ExternalRatingReason,
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  cacheAgeMs: number | null = null,
  errorCode: string | null = null
): ExternalRatingDiagnostic => ({
  cacheAgeMs,
  errorCode,
  reason,
  stage,
  target,
});

const failureReason = (
  error: unknown
): "cancelled" | "parse-error" | "request-error" => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "cancelled";
  }
  if (error instanceof SyntaxError) {
    return "parse-error";
  }
  return "request-error";
};

/** Cache by requested title and season, e.g. "tt0944947-s05". */
const seasonCacheKey = (titleId: string, season: number): string =>
  `${titleId}-s${String(season).padStart(2, "0")}`;

const imdbTitleUrl = (titleId: string): string =>
  `https://www.imdb.com/title/${encodeURIComponent(titleId)}/`;

const imdbSeasonUrl = (seriesId: string, season: number): string =>
  `${imdbTitleUrl(seriesId)}episodes/?season=${season}`;

const postGraphQL = (
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal
): Promise<string> =>
  gmPost(
    IMDB_GRAPHQL_URL,
    JSON.stringify({ query, variables }),
    IMDB_REFERER,
    IMDB_HEADERS,
    signal ? { signal } : undefined
  );

const parsedResponseFailure = (
  json: string
): { errorCode: string; reason: "parse-error" | "request-error" } => {
  try {
    const data = JSON.parse(json) as { errors?: unknown };
    if (data.errors !== undefined) {
      return { errorCode: "imdb-api-error", reason: "request-error" };
    }
    return { errorCode: "invalid-title-response", reason: "parse-error" };
  } catch {
    return { errorCode: "invalid-json", reason: "parse-error" };
  }
};

/** First pass: get title info + detect whether the tconst is an episode. */
const fetchTitleInfo = async (
  imdbId: string,
  signal?: AbortSignal
): Promise<TitleInfoResult> => {
  try {
    const json = await postGraphQL(GRAPHQL_QUERY, { id: imdbId }, signal);
    const parsed = parseResponse(json);
    if ("error" in parsed) {
      return parsedResponseFailure(json);
    }
    return { response: parsed };
  } catch (error) {
    const reason = failureReason(error);
    return {
      errorCode: reason === "cancelled" ? "aborted" : "imdb-request",
      reason,
    };
  }
};

/** Fetch episode ratings for a season and return their vote-weighted average. */
const fetchSeasonRating = async (
  seriesId: string,
  season: number,
  signal?: AbortSignal
): Promise<SeasonRatingResult> => {
  let json: string;
  try {
    json = await postGraphQL(
      SEASON_EPISODES_QUERY,
      { id: seriesId, season: String(season) },
      signal
    );
  } catch (error) {
    const reason = failureReason(error);
    return {
      errorCode: reason === "cancelled" ? "aborted" : "imdb-season-request",
      status: reason,
    };
  }

  let parsed: {
    data?: {
      title?: {
        episodes?: { episodes?: { edges?: unknown[] } };
      };
    };
    errors?: unknown;
  };
  try {
    parsed = JSON.parse(json) as typeof parsed;
  } catch {
    return { errorCode: "invalid-json", status: "parse-error" };
  }
  if (parsed.errors !== undefined) {
    return { errorCode: "imdb-api-error", status: "request-error" };
  }
  if (!Array.isArray(parsed.data?.title?.episodes?.episodes?.edges)) {
    return { errorCode: "invalid-season-response", status: "parse-error" };
  }
  const result = parseSeasonRating(json);
  return result
    ? { rating: result.rating, status: "rating" }
    : { status: "source-no-rating" };
};

const cachedRating = (
  imdbId: string,
  entry: ReturnType<typeof imdbCache.get>,
  onOutcome?: OnImdbOutcome
): FetchImdbResult | null => {
  if (!entry) {
    return null;
  }
  onOutcome?.(
    makeDiagnostic(
      "rating",
      "cache",
      imdbId,
      Number.isFinite(entry.fetchedAt)
        ? Math.max(0, Date.now() - entry.fetchedAt)
        : null
    )
  );
  return {
    rating: entry.rating,
    sourceUrl: entry.sourceUrl,
    title: entry.title,
  };
};

const diagnosticStage = (
  reason: ExternalRatingReason
): ExternalRatingDiagnostic["stage"] => {
  if (reason === "request-error" || reason === "cancelled") {
    return "request";
  }
  return "parse";
};

const publishTitleFailure = (
  target: string,
  failure: Extract<TitleInfoResult, { errorCode: string }>,
  onOutcome?: OnImdbOutcome
): void => {
  onOutcome?.(
    makeDiagnostic(
      failure.reason,
      diagnosticStage(failure.reason),
      target,
      null,
      failure.errorCode
    )
  );
};

const fetchSeasonTitleRating = async (
  imdbId: string,
  season: number,
  signal: AbortSignal | undefined,
  onOutcome?: OnImdbOutcome
): Promise<FetchImdbResult> => {
  const cacheKey = seasonCacheKey(imdbId, season);
  const cached = cachedRating(imdbId, imdbCache.get(cacheKey), onOutcome);
  if (cached) {
    return cached;
  }

  const titleInfoResult = await fetchTitleInfo(imdbId, signal);
  if ("errorCode" in titleInfoResult) {
    publishTitleFailure(imdbId, titleInfoResult, onOutcome);
    return { rating: null, sourceUrl: null, title: null };
  }

  const { titleText, seriesInfo, titleTypeId } = titleInfoResult.response;
  const seriesId =
    seriesInfo?.id ?? (titleTypeId === "tvSeries" ? imdbId : null);
  if (seriesId === null) {
    onOutcome?.(
      makeDiagnostic(
        "mapping-missing",
        "mapping",
        imdbId,
        null,
        "season-parent-missing"
      )
    );
    return { rating: null, sourceUrl: null, title: titleText };
  }

  const seasonResult = await fetchSeasonRating(seriesId, season, signal);
  const title = seriesInfo?.titleText ?? titleText;
  const sourceUrl = imdbSeasonUrl(seriesId, season);
  if (seasonResult.status === "source-no-rating") {
    onOutcome?.(
      makeDiagnostic("source-no-rating", "rating", `${seriesId}-s${season}`)
    );
    return { rating: null, sourceUrl, title };
  }
  if (seasonResult.status !== "rating") {
    onOutcome?.(
      makeDiagnostic(
        seasonResult.status,
        diagnosticStage(seasonResult.status),
        `${seriesId}-s${season}`,
        null,
        seasonResult.errorCode
      )
    );
    return { rating: null, sourceUrl, title };
  }

  const cacheTitle = title ?? "";
  const fetchedAt = Date.now();
  imdbCache.set(cacheKey, {
    fetchedAt,
    rating: seasonResult.rating,
    sourceUrl,
    title: cacheTitle,
  });
  onOutcome?.(makeDiagnostic("rating", "rating", `${seriesId}-s${season}`, 0));
  return { rating: seasonResult.rating, sourceUrl, title: cacheTitle };
};

const fetchDirectTitleRating = async (
  imdbId: string,
  signal: AbortSignal | undefined,
  onOutcome?: OnImdbOutcome
): Promise<FetchImdbResult> => {
  const cached = cachedRating(imdbId, imdbCache.get(imdbId), onOutcome);
  if (cached) {
    return cached;
  }
  const titleInfoResult = await fetchTitleInfo(imdbId, signal);
  if ("errorCode" in titleInfoResult) {
    publishTitleFailure(imdbId, titleInfoResult, onOutcome);
    return { rating: null, sourceUrl: null, title: null };
  }

  const { aggregateRating, voteCount, titleText } = titleInfoResult.response;
  if (typeof aggregateRating !== "number" || typeof voteCount !== "number") {
    onOutcome?.(makeDiagnostic("source-no-rating", "rating", imdbId));
    return { rating: null, sourceUrl: imdbTitleUrl(imdbId), title: titleText };
  }
  const rating: NonNullable<ImdbRating> = {
    count: voteCount,
    score: aggregateRating,
  };
  const title = typeof titleText === "string" ? titleText : "";
  const sourceUrl = imdbTitleUrl(imdbId);
  imdbCache.set(imdbId, { fetchedAt: Date.now(), rating, sourceUrl, title });
  onOutcome?.(makeDiagnostic("rating", "rating", imdbId, 0));
  return { rating, sourceUrl, title };
};

/**
 * Resolve an IMDb rating for a title and optionally a specific season.
 * Failure reasons are reported separately from the rating data for runtime diagnostics.
 */
const fetchImdbRating = (
  imdbId: string,
  season?: number,
  signal?: AbortSignal,
  onOutcome?: OnImdbOutcome
): Promise<FetchImdbResult> => {
  if (!imdbId) {
    onOutcome?.(
      makeDiagnostic("mapping-missing", "mapping", null, null, "no-imdb-id")
    );
    return Promise.resolve({ rating: null, sourceUrl: null, title: null });
  }
  if (signal?.aborted) {
    onOutcome?.(
      makeDiagnostic("cancelled", "request", imdbId, null, "aborted")
    );
    return Promise.resolve({ rating: null, sourceUrl: null, title: null });
  }
  if (season !== undefined) {
    return fetchSeasonTitleRating(imdbId, season, signal, onOutcome);
  }
  return fetchDirectTitleRating(imdbId, signal, onOutcome);
};

export { fetchImdbRating };
export type { FetchImdbResult, OnImdbOutcome };
