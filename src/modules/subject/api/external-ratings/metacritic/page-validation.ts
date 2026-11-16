import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { failureDiagnostic, makeDiagnostic } from "./diagnostics";
import type { OnMcOutcome } from "./diagnostics";
import { readMcPage } from "./page";
import type { McPageReadResult } from "./page";
import {
  identityNamesForAlias,
  METACRITIC_ORIGIN,
  readVerifiedSeasonPage,
  requestMcPage,
} from "./page-request";
import type { IdentityNameResolution } from "./page-request";
import { generationOf, invalidateRatingTarget } from "./rating-state";
import type { MetacriticTarget } from "./wikidata/claims";

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

export { handlePageMismatch, loadPageForTarget };
