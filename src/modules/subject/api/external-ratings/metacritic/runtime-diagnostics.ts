import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import { createExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";

import type { OnMcOutcome } from "./diagnostics";
import type { MetacriticTargetResolution } from "./wikidata/resolve";

const failureReasonFromError = (
  error: unknown,
  signal: AbortSignal
): ExternalRatingDiagnostic["reason"] => {
  if (signal.aborted) {
    return "cancelled";
  }
  return error instanceof SyntaxError ? "parse-error" : "request-error";
};

const report = (
  onOutcome: OnMcOutcome | undefined,
  reason: ExternalRatingDiagnostic["reason"],
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  errorCode: string | null = null,
  fetchedAt: number | null = null
): void => {
  onOutcome?.(
    createExternalRatingDiagnostic({
      cacheAgeMs:
        fetchedAt === null ? null : Math.max(0, Date.now() - fetchedAt),
      errorCode,
      reason,
      stage,
      target,
    })
  );
};

const withResolutionEvidence = (
  diagnostic: ExternalRatingDiagnostic,
  resolution: MetacriticTargetResolution
): ExternalRatingDiagnostic =>
  createExternalRatingDiagnostic({
    ...diagnostic,
    acceptedEvidence: [
      ...(resolution.acceptedEvidence ?? []),
      ...diagnostic.acceptedEvidence,
    ],
    candidateTargets: [
      ...(resolution.candidateTargets ?? []),
      ...diagnostic.candidateTargets,
    ],
    missingEvidence: [
      ...(resolution.missingEvidence ?? []),
      ...diagnostic.missingEvidence,
    ],
    rejectedEvidence: [
      ...(resolution.rejectedEvidence ?? []),
      ...diagnostic.rejectedEvidence,
    ],
    unverifiedEvidence: [
      ...(resolution.unverifiedEvidence ?? []),
      ...diagnostic.unverifiedEvidence,
    ],
  });

export { failureReasonFromError, report, withResolutionEvidence };
