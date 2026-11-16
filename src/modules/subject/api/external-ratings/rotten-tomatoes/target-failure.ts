import { createExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { fallbackSnapshot, ratingFailure } from "./rating-outcome";
import type { RtResolution } from "./rating-outcome";
import { invalidateRequests } from "./request-revision";
import { removeSnapshotsForContext } from "./snapshot";
import { invalidateRtTarget } from "./target";
import type { ResolvedRtTarget, RtTargetResult } from "./target";

const targetFailureReason = (
  failure: Exclude<RtTargetResult, ResolvedRtTarget>["failure"]
): ExternalRatingReason => {
  switch (failure) {
    case "identity-conflict": {
      return "identity-conflict";
    }
    case "aborted": {
      return "cancelled";
    }
    case "parse-error": {
      return "parse-error";
    }
    case "error":
    case "identity-unavailable":
    case "request-error": {
      return "request-error";
    }
    default: {
      return "mapping-missing";
    }
  }
};

const targetFailureStage = (
  failure: Exclude<RtTargetResult, ResolvedRtTarget>["failure"]
): ExternalRatingDiagnostic["stage"] => {
  switch (failure) {
    case "identity-conflict":
    case "identity-unavailable": {
      return "identity";
    }
    case "aborted":
    case "error":
    case "request-error": {
      return "request";
    }
    case "parse-error": {
      return "parse";
    }
    default: {
      return "mapping";
    }
  }
};

const targetFailureDiagnostic = (
  targetFailure: Exclude<RtTargetResult, ResolvedRtTarget>
): ExternalRatingDiagnostic => {
  const { failure } = targetFailure;
  return createExternalRatingDiagnostic({
    acceptedEvidence: targetFailure.acceptedEvidence ?? [],
    cacheAgeMs: null,
    candidateTargets: targetFailure.candidateTargets ?? [],
    errorCode: failure === "error" ? "rt-mapping-request" : failure,
    missingEvidence: targetFailure.missingEvidence ?? [],
    reason: targetFailureReason(failure),
    rejectedEvidence: targetFailure.rejectedEvidence ?? [],
    stage: targetFailureStage(failure),
    target: null,
    unverifiedEvidence: targetFailure.unverifiedEvidence ?? [],
  });
};

const targetFailureResult = (
  context: ResolutionContext,
  targetFailure: Exclude<RtTargetResult, ResolvedRtTarget>,
  onResult?: (result: RtResolution) => void
): RtResolution => {
  const { failure } = targetFailure;
  const diagnostic = targetFailureDiagnostic(targetFailure);
  if (
    failure === "error" ||
    failure === "request-error" ||
    failure === "parse-error"
  ) {
    const fallback = fallbackSnapshot(context, null, null, onResult);
    return { ...fallback, diagnostic };
  }
  if (failure === "identity-unavailable") {
    const fallback = fallbackSnapshot(context, null, null, onResult);
    const unavailable = fallback.rating
      ? { ...fallback, diagnostic }
      : ratingFailure("identity-unavailable", null, diagnostic);
    onResult?.(unavailable);
    return unavailable;
  }
  if (failure === "identity-conflict") {
    invalidateRequests(context);
    invalidateRtTarget(context);
    removeSnapshotsForContext(context.subjectId, context.kind);
  }
  const result = ratingFailure(failure, null, diagnostic);
  onResult?.(result);
  return result;
};

export { targetFailureResult };
