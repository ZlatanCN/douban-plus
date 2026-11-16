import type { ImdbRating } from "@/modules/subject/domain";
import { gmPost } from "@/shared/utils/request";

import { parseResponse, parseSeasonRating } from "./parsers";
import type { ParsedResponse } from "./parsers";

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

export { fetchSeasonRating, fetchTitleInfo };
export type { SeasonRatingResult, TitleInfoResult };
