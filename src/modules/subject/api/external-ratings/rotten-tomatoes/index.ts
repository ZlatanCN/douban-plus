import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import type { RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { TARGET_REVALIDATION_INTERVAL } from "../shared/verified-target-cache";
import {
  fallbackSnapshot,
  getSnapshotObject,
  isConfirmedRatingStatus,
  loadRating,
  ratingFailure,
} from "./rating";
import type { RtResolution } from "./rating";
import {
  currentRevision,
  invalidateRequests,
  isCurrent,
} from "./request-revision";
import { readSnapshot, removeSnapshotsForContext } from "./snapshot";
import type { ResolvedRtTarget, RtTargetResult } from "./target";
import {
  cacheRtTarget,
  getCachedRtTarget,
  invalidateRtTarget,
  resolveRtTarget,
} from "./target";
import { refreshCachedTarget } from "./target-refresh";

type TargetLookup = {
  cacheEntry: ReturnType<typeof getCachedRtTarget>;
  target: RtTargetResult;
};

const resolveTargetForRequest = async (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<TargetLookup> => {
  const cacheEntry =
    !context.subjectId ||
    context.seasonConflict ||
    context.unsupportedEpisode ||
    (context.kind === "season" && context.season === null)
      ? null
      : getCachedRtTarget(context);
  const target =
    cacheEntry?.status === "resolved"
      ? cacheEntry.target
      : await resolveRtTarget(context, signal);
  return { cacheEntry, target };
};

const targetFailureResult = (
  context: ResolutionContext,
  failure: Exclude<RtTargetResult, ResolvedRtTarget>["failure"],
  onResult?: (result: RtResolution) => void
): RtResolution => {
  if (
    failure === "error" ||
    failure === "request-error" ||
    failure === "parse-error"
  ) {
    const fallback = fallbackSnapshot(context, null, null, onResult);
    const reason: ExternalRatingReason =
      failure === "parse-error" ? "parse-error" : "request-error";
    return {
      ...fallback,
      diagnostic: {
        cacheAgeMs: null,
        errorCode: failure === "error" ? "rt-mapping-request" : failure,
        reason,
        stage: failure === "parse-error" ? "parse" : "mapping",
        target: null,
      },
    };
  }
  if (failure === "identity-unavailable") {
    const snapshotFallback = fallbackSnapshot(context, null, null, onResult);
    if (snapshotFallback.rating) {
      return {
        ...snapshotFallback,
        diagnostic: {
          cacheAgeMs: null,
          errorCode: "identity-unavailable",
          reason: "request-error",
          stage: "identity",
          target: null,
        },
      };
    }
    const unavailable = ratingFailure("identity-unavailable", null, {
      cacheAgeMs: null,
      errorCode: "identity-unavailable",
      reason: "request-error",
      stage: "identity",
      target: null,
    });
    onResult?.(unavailable);
    return unavailable;
  }
  if (failure === "identity-conflict") {
    invalidateRequests(context);
    invalidateRtTarget(context);
    removeSnapshotsForContext(context.subjectId, context.kind);
    const conflict = ratingFailure("identity-conflict");
    onResult?.(conflict);
    return conflict;
  }
  return ratingFailure(failure);
};

const failedRtFetch = (
  context: ResolutionContext,
  revision: number,
  signal: AbortSignal,
  object: RtRating["object"] | null,
  prior: RtRating | null,
  error: unknown,
  onResult?: (result: RtResolution) => void
): RtResolution => {
  if (signal.aborted) {
    return ratingFailure("aborted", null, {
      cacheAgeMs: null,
      errorCode: "aborted",
      reason: "cancelled",
      stage: "request",
      target: object?.rtId ?? null,
    });
  }
  if (!isCurrent(context, revision)) {
    return ratingFailure("identity-conflict", null, {
      cacheAgeMs: null,
      errorCode: "stale-request",
      reason: "identity-conflict",
      stage: "identity",
      target: object?.rtId ?? null,
    });
  }
  let reason: ExternalRatingReason;
  if (error instanceof DOMException && error.name === "AbortError") {
    reason = "cancelled";
  } else if (error instanceof SyntaxError) {
    reason = "parse-error";
  } else {
    reason = "request-error";
  }
  const diagnostic: ExternalRatingDiagnostic = {
    cacheAgeMs: null,
    errorCode: reason === "cancelled" ? "aborted" : "rt-fetch",
    reason,
    stage: reason === "parse-error" ? "parse" : "request",
    target: object?.rtId ?? null,
  };
  return {
    ...fallbackSnapshot(context, object, prior, onResult),
    diagnostic,
  };
};

const fetchRtRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onResult?: (result: RtResolution) => void
): Promise<RtResolution> => {
  const revision = currentRevision(context);
  let object: RtRating["object"] | null = null;
  let prior: RtRating | null = null;
  try {
    const { cacheEntry, target } = await resolveTargetForRequest(
      context,
      signal
    );
    if (signal.aborted || !isCurrent(context, revision)) {
      return ratingFailure(signal.aborted ? "aborted" : "identity-conflict");
    }
    if ("failure" in target) {
      return targetFailureResult(context, target.failure, onResult);
    }
    object = getSnapshotObject(context, target.rtId);
    prior = readSnapshot(object);
    if (
      cacheEntry?.status === "resolved" &&
      Date.now() - cacheEntry.verifiedAt >= TARGET_REVALIDATION_INTERVAL
    ) {
      void refreshCachedTarget(
        context,
        cacheEntry.target,
        signal,
        revision,
        onResult
      );
    }
    const result = await loadRating(
      context,
      target,
      object,
      prior,
      signal,
      revision,
      onResult
    );
    if (
      isCurrent(context, revision) &&
      cacheEntry?.status !== "resolved" &&
      isConfirmedRatingStatus(result.status)
    ) {
      cacheRtTarget(context, target);
    }
    return isCurrent(context, revision)
      ? result
      : ratingFailure("identity-conflict");
  } catch (error) {
    return failedRtFetch(
      context,
      revision,
      signal,
      object,
      prior,
      error,
      onResult
    );
  }
};

export { fetchRtRating, type RtResolution };
