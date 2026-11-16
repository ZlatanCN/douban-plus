import { fetchImdbRating } from "@/modules/subject/api/external-ratings/imdb";
import type { FetchImdbResult } from "@/modules/subject/api/external-ratings/imdb";
import { fetchMcRating } from "@/modules/subject/api/external-ratings/metacritic";
import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import { fetchRtRating } from "@/modules/subject/api/external-ratings/rotten-tomatoes";
import type { McRating, RtRating } from "@/modules/subject/domain";

import {
  addDiagnosticEvidence,
  imdbDiagnostic,
  metacriticDiagnostic,
  rtDiagnostic,
} from "./diagnostics";
import type { ResolutionContext, SourceResult } from "./types";

type RatingUpdate =
  | { result: SourceResult<FetchImdbResult>; source: "imdb" }
  | { result: SourceResult<McRating>; source: "mc" }
  | { result: SourceResult<RtRating>; source: "rt" };
type OnRatingUpdate = (update: RatingUpdate) => void;

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
            addDiagnosticEvidence(
              imdbOutcome ?? imdbDiagnostic(rating, context),
              "imdb",
              context
            )
          ),
          source: "imdb",
        })
    );
  } else {
    onUpdate({
      result: sourceResult<FetchImdbResult>(
        null,
        addDiagnosticEvidence(imdbDiagnostic(null, context), "imdb", context)
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
                addDiagnosticEvidence(
                  mcOutcome ?? metacriticDiagnostic(rating, context),
                  "mc",
                  context
                )
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
            addDiagnosticEvidence(
              mcOutcome ?? metacriticDiagnostic(rating, context),
              "mc",
              context
            )
          ),
          source: "mc",
        })
    );
  } else {
    onUpdate({
      result: sourceResult<McRating>(
        null,
        addDiagnosticEvidence(
          metacriticDiagnostic(null, context),
          "mc",
          context
        )
      ),
      source: "mc",
    });
  }

  const resolveRottenTomatoes = async (): Promise<void> => {
    let result: Awaited<ReturnType<typeof fetchRtRating>>;
    try {
      result = await fetchRtRating(context, signal, (partial) => {
        if (!signal.aborted) {
          onUpdate({
            result: sourceResult(
              partial.rating,
              addDiagnosticEvidence(rtDiagnostic(partial), "rt", context),
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
        result: sourceResult(
          result.rating,
          addDiagnosticEvidence(rtDiagnostic(result), "rt", context)
        ),
        source: "rt",
      });
    }
  };
  void resolveRottenTomatoes();
};

export { resolveAll };
export type { OnRatingUpdate, RatingUpdate };
