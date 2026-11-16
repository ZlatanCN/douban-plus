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
  if (failure === "error") {
    return fallbackSnapshot(context, null, null, onResult);
  }
  if (failure === "identity-unavailable") {
    const snapshotFallback = fallbackSnapshot(context, null, null, onResult);
    if (snapshotFallback.rating) {
      return snapshotFallback;
    }
    const unavailable = ratingFailure("identity-unavailable");
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
  } catch {
    if (signal.aborted) {
      return ratingFailure("aborted");
    }
    if (!isCurrent(context, revision)) {
      return ratingFailure("identity-conflict");
    }
    return fallbackSnapshot(context, object, prior, onResult);
  }
};

export { fetchRtRating, type RtResolution };
