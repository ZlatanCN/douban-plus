import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { readMcPage } from "./page";
import type { McPageReadResult } from "./page";
import {
  identityNamesForAlias,
  METACRITIC_ORIGIN,
  readVerifiedSeasonPage,
  requestMcPage,
} from "./page-request";
import type { IdentityNameResolution } from "./page-request";
import {
  generationOf,
  invalidateRatingTarget,
  removeRatingSnapshot,
  sameTarget,
  targetObject,
} from "./rating-state";
import { readSnapshot, writeSnapshot } from "./snapshot";
import { finishSeasonLinkResolution } from "./target-resolution";
import type { MetacriticTarget } from "./wikidata/claims";
import {
  cacheMetacriticTarget,
  resolveMetacriticTargetFresh,
} from "./wikidata/resolve";
import type { MetacriticTargetResolution } from "./wikidata/resolve";

type OnMcOutcome = (diagnostic: ExternalRatingDiagnostic) => void;

const makeDiagnostic = (
  reason: ExternalRatingReason,
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

const failureReasonFromError = (error: unknown): ExternalRatingReason => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "cancelled";
  }
  if (error instanceof SyntaxError) {
    return "parse-error";
  }
  return "request-error";
};

const failureDiagnostic = (
  error: unknown,
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  errorCode: string
): ExternalRatingDiagnostic => ({
  ...makeDiagnostic(
    failureReasonFromError(error),
    stage,
    target,
    null,
    errorCode
  ),
});

const loadPageForTarget = async (
  context: ResolutionContext,
  target: MetacriticTarget,
  signal: AbortSignal,
  generation: number,
  onOutcome?: OnMcOutcome
): Promise<{
  identityNames: IdentityNameResolution;
  page: McPageReadResult;
} | null> => {
  let response;
  try {
    response = await requestMcPage(
      `${METACRITIC_ORIGIN}/${target.metacriticId}/`,
      signal
    );
  } catch (error) {
    onOutcome?.(
      failureDiagnostic(
        error,
        "request",
        target.metacriticId,
        "mc-page-request"
      )
    );
    return null;
  }
  if (signal.aborted || generationOf(context) !== generation) {
    const reason = signal.aborted ? "cancelled" : "identity-conflict";
    const stage = signal.aborted ? "request" : "identity";
    const errorCode = signal.aborted ? "aborted" : "stale-request";
    onOutcome?.(
      makeDiagnostic(reason, stage, target.metacriticId, null, errorCode)
    );
    return null;
  }
  const identityNames = await identityNamesForAlias(
    response.responseText,
    target,
    signal
  );
  if (signal.aborted || generationOf(context) !== generation) {
    const reason = signal.aborted ? "cancelled" : "identity-conflict";
    const stage = signal.aborted ? "request" : "identity";
    const errorCode = signal.aborted ? "aborted" : "stale-request";
    onOutcome?.(
      makeDiagnostic(reason, stage, target.metacriticId, null, errorCode)
    );
    return null;
  }
  const page =
    target.kind === "season"
      ? await readVerifiedSeasonPage(
          context,
          response,
          target,
          identityNames,
          signal
        )
      : readMcPage(response.responseText, target, {
          ...(target.seriesMetacriticId
            ? { expectedSeriesUrl: target.seriesMetacriticId }
            : {}),
          finalUrl: response.finalUrl,
          identityNames: identityNames.names,
          identityNamesComplete: identityNames.complete,
          identityEvidence: context.identityEvidence,
        });
  return { identityNames, page };
};

const handlePageMismatch = (
  context: ResolutionContext,
  target: MetacriticTarget,
  object: McRating["object"],
  prior: McRating | null,
  reason: "identity-conflict" | "invalid-page" | "request-error",
  identityFailure: IdentityNameResolution["failure"],
  onOutcome?: OnMcOutcome
): McRating | null => {
  let failureReason: ExternalRatingReason;
  if (reason === "identity-conflict") {
    failureReason = "identity-conflict";
  } else if (identityFailure) {
    failureReason = identityFailure;
  } else if (reason === "request-error") {
    failureReason = "request-error";
  } else {
    failureReason = "parse-error";
  }
  let stage: ExternalRatingDiagnostic["stage"];
  let errorCode: string;
  if (failureReason === "identity-conflict") {
    stage = "identity";
    errorCode = "mc-conflict";
  } else if (failureReason === "parse-error") {
    stage = "parse";
    errorCode = "invalid-page";
  } else {
    stage = "request";
    errorCode = "mc-alias-evidence";
  }
  onOutcome?.(
    makeDiagnostic(failureReason, stage, target.metacriticId, null, errorCode)
  );
  if (failureReason === "identity-conflict") {
    invalidateRatingTarget(context, object);
    return null;
  }
  return prior;
};

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

const cachedTargetFailureDiagnostic = (
  resolution: MetacriticTargetResolution,
  signal: AbortSignal,
  target: string
): ExternalRatingDiagnostic => {
  if (signal.aborted) {
    return makeDiagnostic("cancelled", "mapping", target, null, "aborted");
  }
  if (resolution.status === "ambiguous" || resolution.status === "missing") {
    return makeDiagnostic(
      "mapping-missing",
      "mapping",
      target,
      null,
      "mc-mapping-missing"
    );
  }
  return makeDiagnostic(
    resolution.failure ?? "request-error",
    "mapping",
    target,
    null,
    "mc-revalidate"
  );
};

const revalidateCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  signal: AbortSignal,
  onOutcome?: OnMcOutcome
): Promise<MetacriticTarget | null> => {
  let resolution: MetacriticTargetResolution;
  try {
    resolution = await finishSeasonLinkResolution(
      context,
      await resolveMetacriticTargetFresh(context, signal),
      signal
    );
  } catch (error) {
    onOutcome?.(
      failureDiagnostic(
        error,
        "mapping",
        cachedTarget.metacriticId,
        "mc-revalidate"
      )
    );
    return cachedTarget;
  }
  if (
    !resolution.complete ||
    signal.aborted ||
    resolution.status === "error" ||
    resolution.status === "ambiguous" ||
    resolution.status === "missing"
  ) {
    onOutcome?.(
      cachedTargetFailureDiagnostic(
        resolution,
        signal,
        cachedTarget.metacriticId
      )
    );
    return cachedTarget;
  }
  if (
    resolution.status === "matched" &&
    sameTarget(resolution.target, cachedTarget)
  ) {
    cacheMetacriticTarget(context, cachedTarget);
    return cachedTarget;
  }
  const priorObject = targetObject(context, cachedTarget);
  if (resolution.status === "identity-conflict") {
    onOutcome?.(
      makeDiagnostic(
        "identity-conflict",
        "identity",
        cachedTarget.metacriticId,
        null,
        "mc-conflict"
      )
    );
    invalidateRatingTarget(context, priorObject);
    return null;
  }
  invalidateRatingTarget(context, priorObject);
  onOutcome?.(
    makeDiagnostic(
      "mapping-missing",
      "mapping",
      cachedTarget.metacriticId,
      null,
      "mc-target-changed"
    )
  );
  return resolution.status === "matched" ? resolution.target : null;
};

export { fetchRatingForTarget, revalidateCachedTarget };
export type { OnMcOutcome };
