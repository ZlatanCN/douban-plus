import { fetchImdbRating } from "@/modules/subject/api/external-ratings/imdb";
import type { FetchImdbResult } from "@/modules/subject/api/external-ratings/imdb";
import { fetchMcRating } from "@/modules/subject/api/external-ratings/metacritic";
import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import { fetchRtRating } from "@/modules/subject/api/external-ratings/rotten-tomatoes";
import type { RtResolution } from "@/modules/subject/api/external-ratings/rotten-tomatoes";
import type { McRating, RtRating } from "@/modules/subject/domain";

import type { ResolutionContext, SourceResult } from "./types";

type RatingUpdate =
  | { result: SourceResult<FetchImdbResult>; source: "imdb" }
  | { result: SourceResult<McRating>; source: "mc" }
  | { result: SourceResult<RtRating>; source: "rt" };
type OnRatingUpdate = (update: RatingUpdate) => void;

const makeDiagnostic = (
  reason: ExternalRatingDiagnostic["reason"],
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  fetchedAt: number | null = null,
  errorCode: string | null = null
): ExternalRatingDiagnostic => ({
  cacheAgeMs: fetchedAt === null ? null : Math.max(0, Date.now() - fetchedAt),
  errorCode,
  reason,
  stage,
  target,
});

const imdbDiagnostic = (
  result: FetchImdbResult | null,
  context: ResolutionContext
): ExternalRatingDiagnostic => {
  if (!context.imdbId) {
    return makeDiagnostic(
      "mapping-missing",
      "mapping",
      null,
      null,
      "no-imdb-id"
    );
  }
  if (result?.rating) {
    return makeDiagnostic("rating", "rating", context.imdbId);
  }
  return result?.sourceUrl
    ? makeDiagnostic("source-no-rating", "rating", context.imdbId)
    : makeDiagnostic(
        "request-error",
        "request",
        context.imdbId,
        null,
        "imdb-fetch"
      );
};

const metacriticDiagnostic = (
  rating: McRating | null,
  context: ResolutionContext
): ExternalRatingDiagnostic => {
  if (rating) {
    return makeDiagnostic(
      "rating",
      rating.stale ? "cache" : "rating",
      rating.object.metacriticId,
      rating.fetchedAt
    );
  }
  if (
    !context.subjectId ||
    context.seasonConflict ||
    context.unsupportedEpisode ||
    (context.kind === "season" && context.season === null)
  ) {
    return makeDiagnostic(
      "mapping-missing",
      "mapping",
      null,
      null,
      "no-target"
    );
  }
  return makeDiagnostic(
    "request-error",
    "request",
    null,
    null,
    "mc-unresolved"
  );
};

const rtDiagnostic = (result: RtResolution): ExternalRatingDiagnostic => {
  if (result.diagnostic) {
    return result.diagnostic;
  }
  if (result.rating) {
    return makeDiagnostic(
      "rating",
      result.status === "cached" || result.status === "stale"
        ? "cache"
        : "rating",
      result.rating.object.rtId,
      result.rating.fetchedAt
    );
  }
  switch (result.status) {
    case "aborted": {
      return makeDiagnostic("cancelled", "request", null, null, "aborted");
    }
    case "identity-conflict": {
      return makeDiagnostic(
        "identity-conflict",
        "identity",
        null,
        null,
        "rt-conflict"
      );
    }
    case "missing-mapping":
    case "season-unmatched": {
      return makeDiagnostic(
        "mapping-missing",
        "mapping",
        null,
        null,
        result.status
      );
    }
    case "no-rating": {
      return makeDiagnostic(
        "source-no-rating",
        "parse",
        null,
        null,
        "no-rating"
      );
    }
    case "error":
    case "identity-unavailable": {
      return makeDiagnostic(
        "request-error",
        "request",
        null,
        null,
        result.status
      );
    }
    case "cached":
    case "refreshed":
    case "stale": {
      return makeDiagnostic(
        "source-no-rating",
        "parse",
        null,
        null,
        "missing-result"
      );
    }
    default: {
      return makeDiagnostic(
        "request-error",
        "request",
        null,
        null,
        "rt-unresolved"
      );
    }
  }
};

const sourceResult = <TRating>(
  rating: TRating | null,
  diagnostic: ExternalRatingDiagnostic,
  status: SourceResult<TRating>["status"] = "resolved"
): SourceResult<TRating> => ({ diagnostic, rating, status });

const settle = async <TRating>(
  request: Promise<TRating | null>,
  signal: AbortSignal,
  publish: (rating: TRating | null) => void
): Promise<void> => {
  let rating: TRating | null = null;
  try {
    rating = await request;
  } catch {
    rating = null;
  }
  if (!signal.aborted) {
    publish(rating);
  }
};

const resolveAll = (
  context: ResolutionContext,
  signal: AbortSignal,
  onUpdate: OnRatingUpdate
): void => {
  if (
    context.imdbId &&
    !context.seasonConflict &&
    !context.unsupportedEpisode
  ) {
    let imdbOutcome: ExternalRatingDiagnostic | null = null;
    void settle(
      fetchImdbRating(
        context.imdbId,
        context.season ?? undefined,
        signal,
        (diagnostic) => {
          imdbOutcome = diagnostic;
        }
      ),
      signal,
      (rating) =>
        onUpdate({
          result: sourceResult(
            rating,
            imdbOutcome ?? imdbDiagnostic(rating, context)
          ),
          source: "imdb",
        })
    );
  } else {
    onUpdate({
      result: sourceResult<FetchImdbResult>(
        null,
        imdbDiagnostic(null, context)
      ),
      source: "imdb",
    });
  }

  if (context.imdbId || context.subjectId) {
    let mcOutcome: ExternalRatingDiagnostic | null = null;
    void settle(
      fetchMcRating(
        context,
        signal,
        (rating) => {
          if (!signal.aborted) {
            onUpdate({
              result: sourceResult(
                rating,
                mcOutcome ?? metacriticDiagnostic(rating, context)
              ),
              source: "mc",
            });
          }
        },
        (diagnostic) => {
          mcOutcome = diagnostic;
        }
      ),
      signal,
      (rating) =>
        onUpdate({
          result: sourceResult(
            rating,
            mcOutcome ?? metacriticDiagnostic(rating, context)
          ),
          source: "mc",
        })
    );
  } else {
    onUpdate({
      result: sourceResult<McRating>(null, metacriticDiagnostic(null, context)),
      source: "mc",
    });
  }

  const resolveRottenTomatoes = async (): Promise<void> => {
    let result: RtResolution;
    try {
      result = await fetchRtRating(context, signal, (partial) => {
        if (!signal.aborted) {
          onUpdate({
            result: sourceResult(
              partial.rating,
              rtDiagnostic(partial),
              partial.status === "stale" ? "pending" : "resolved"
            ),
            source: "rt",
          });
        }
      });
    } catch {
      result = { rating: null, status: "error" };
    }
    if (!signal.aborted) {
      onUpdate({
        result: sourceResult(result.rating, rtDiagnostic(result)),
        source: "rt",
      });
    }
  };
  void resolveRottenTomatoes();
};

export { resolveAll };
