import { fetchImdbRating } from "@/modules/subject/api/imdb";
import type { FetchImdbResult } from "@/modules/subject/api/imdb";
import { fetchMcRating } from "@/modules/subject/api/metacritic";
import { fetchRtRating } from "@/modules/subject/api/rotten";
import type { RtResolution } from "@/modules/subject/api/rotten";
import type { McRating, RtRating } from "@/modules/subject/domain";

import type { ResolutionContext, SourceResult } from "./types";

type RatingUpdate =
  | { result: SourceResult<FetchImdbResult>; source: "imdb" }
  | { result: SourceResult<McRating>; source: "mc" }
  | { result: SourceResult<RtRating>; source: "rt" };
type OnRatingUpdate = (update: RatingUpdate) => void;

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
  if (context.imdbId) {
    void settle(
      fetchImdbRating(context.imdbId, context.season ?? undefined),
      signal,
      (rating) =>
        onUpdate({ result: { rating, status: "resolved" }, source: "imdb" })
    );
  } else {
    onUpdate({ result: { rating: null, status: "resolved" }, source: "imdb" });
  }

  if (context.englishTitle) {
    void settle(
      fetchMcRating(
        context.englishTitle,
        context.isTV,
        context.season ?? undefined,
        context.year ?? undefined
      ),
      signal,
      (rating) =>
        onUpdate({ result: { rating, status: "resolved" }, source: "mc" })
    );
  } else {
    onUpdate({ result: { rating: null, status: "resolved" }, source: "mc" });
  }

  const resolveRottenTomatoes = async (): Promise<void> => {
    let result: RtResolution;
    try {
      result = await fetchRtRating(context, signal, (partial) => {
        if (!signal.aborted) {
          onUpdate({
            result: { rating: partial.rating, status: "pending" },
            source: "rt",
          });
        }
      });
    } catch {
      result = { rating: null, status: "error" };
    }
    if (!signal.aborted) {
      onUpdate({
        result: { rating: result.rating, status: "resolved" },
        source: "rt",
      });
    }
  };
  void resolveRottenTomatoes();
};

export { resolveAll };
