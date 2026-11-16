import type { RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import {
  getSnapshotObject,
  isConfirmedRatingStatus,
  loadRating,
  ratingFailure,
} from "./rating";
import type { OnRtResolution, RtResolution } from "./rating";
import { invalidateRequests, isCurrent } from "./request-revision";
import { readSnapshot, removeSnapshot } from "./snapshot";
import { cacheRtTarget, invalidateRtTarget, resolveRtTarget } from "./target";
import type { ResolvedRtTarget, TargetFailure } from "./target";

const handleTargetFailure = (
  context: ResolutionContext,
  priorObject: RtRating["object"],
  failure: TargetFailure,
  onResult?: OnRtResolution
): void => {
  if (failure === "error") {
    return;
  }
  if (failure === "identity-unavailable") {
    const prior = readSnapshot(priorObject);
    onResult?.(
      prior
        ? { rating: prior, status: "stale" }
        : ratingFailure("identity-unavailable")
    );
    return;
  }
  invalidateRequests(context);
  invalidateRtTarget(context);
  removeSnapshot(priorObject);
  onResult?.(ratingFailure(failure));
};

const refreshChangedTarget = async (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  priorObject: RtRating["object"],
  signal: AbortSignal,
  onResult?: OnRtResolution
): Promise<void> => {
  const revision = invalidateRequests(context);
  invalidateRtTarget(context);
  removeSnapshot(priorObject);
  onResult?.(ratingFailure("identity-conflict"));

  const object = getSnapshotObject(context, target.rtId);
  const prior = readSnapshot(object);
  let result: RtResolution;
  try {
    result = await loadRating(
      context,
      target,
      object,
      prior,
      signal,
      revision,
      onResult
    );
  } catch {
    result = ratingFailure(signal.aborted ? "aborted" : "error");
  }
  if (isCurrent(context, revision) && isConfirmedRatingStatus(result.status)) {
    cacheRtTarget(context, target);
  }
  if (!signal.aborted && isCurrent(context, revision)) {
    onResult?.(result);
  }
};

const refreshCachedTarget = async (
  context: ResolutionContext,
  priorTarget: ResolvedRtTarget,
  signal: AbortSignal,
  revision: number,
  onResult?: OnRtResolution
): Promise<void> => {
  let freshTarget: Awaited<ReturnType<typeof resolveRtTarget>>;
  try {
    freshTarget = await resolveRtTarget(context, signal, true);
  } catch {
    return;
  }
  if (signal.aborted || !isCurrent(context, revision)) {
    return;
  }

  const priorObject = getSnapshotObject(context, priorTarget.rtId);
  if ("failure" in freshTarget) {
    handleTargetFailure(context, priorObject, freshTarget.failure, onResult);
    return;
  }

  if (
    freshTarget.rtId === priorTarget.rtId &&
    freshTarget.seriesRtId === priorTarget.seriesRtId &&
    JSON.stringify(freshTarget.identityPersonIds) ===
      JSON.stringify(priorTarget.identityPersonIds) &&
    JSON.stringify(freshTarget.identityImdbIds) ===
      JSON.stringify(priorTarget.identityImdbIds)
  ) {
    if (isCurrent(context, revision)) {
      cacheRtTarget(context, freshTarget);
    }
    return;
  }

  await refreshChangedTarget(
    context,
    freshTarget,
    priorObject,
    signal,
    onResult
  );
};

export { refreshCachedTarget };
