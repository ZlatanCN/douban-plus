import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { makeDiagnostic } from "./diagnostics";
import type { OnMcOutcome } from "./diagnostics";
import type { readMcPage } from "./page";
import { handlePageMismatch, loadPageForTarget } from "./page-validation";
import {
  generationOf,
  removeRatingSnapshot,
  targetObject,
} from "./rating-state";
import { readSnapshot, writeSnapshot } from "./snapshot";
import type { MetacriticTarget } from "./wikidata/claims";
import { cacheMetacriticTarget } from "./wikidata/resolve";

const finishParsedPage = (
  context: ResolutionContext,
  target: MetacriticTarget,
  object: McRating["object"],
  prior: McRating | null,
  page: Extract<ReturnType<typeof readMcPage>, { matchesTarget: true }>,
  generation: number,
  onOutcome?: OnMcOutcome
): McRating | null => {
  if (page.ratingStatus === "invalid-page") {
    onOutcome?.(
      makeDiagnostic(
        "parse-error",
        "parse",
        target.metacriticId,
        null,
        "invalid-rating"
      )
    );
    return prior;
  }
  if (page.ratingStatus === "no-rating") {
    removeRatingSnapshot(context, object);
    onOutcome?.(
      makeDiagnostic("source-no-rating", "parse", target.metacriticId)
    );
    return null;
  }
  if (page.rating === null) {
    onOutcome?.(
      makeDiagnostic(
        "parse-error",
        "parse",
        target.metacriticId,
        null,
        "missing-score"
      )
    );
    return prior;
  }
  const rating: McRating = {
    ...page.rating,
    fetchedAt: Date.now(),
    object,
    stale: false,
  };
  if (generationOf(context) !== generation) {
    return readSnapshot(object);
  }
  writeSnapshot(rating);
  onOutcome?.(
    makeDiagnostic("rating", "rating", target.metacriticId, Date.now())
  );
  return rating;
};

const fetchRatingForTarget = async (
  context: ResolutionContext,
  target: MetacriticTarget,
  signal: AbortSignal,
  onOutcome?: OnMcOutcome
): Promise<McRating | null> => {
  const object = targetObject(context, target);
  const prior = readSnapshot(object);
  if (prior && !prior.stale) {
    cacheMetacriticTarget(context, target);
    onOutcome?.(
      makeDiagnostic("rating", "cache", target.metacriticId, prior.fetchedAt)
    );
    return prior;
  }
  const generation = generationOf(context);
  const loadedPage = await loadPageForTarget(
    context,
    target,
    signal,
    generation,
    onOutcome
  );
  if (!loadedPage) {
    return signal.aborted ? readSnapshot(object) : prior;
  }
  const { identityNames, page } = loadedPage;
  if (page.matchesTarget === false) {
    return handlePageMismatch(
      context,
      target,
      object,
      prior,
      page.reason,
      identityNames.failure,
      onOutcome
    );
  }
  cacheMetacriticTarget(context, target);
  return finishParsedPage(
    context,
    target,
    object,
    prior,
    page,
    generation,
    onOutcome
  );
};

export { fetchRatingForTarget };
