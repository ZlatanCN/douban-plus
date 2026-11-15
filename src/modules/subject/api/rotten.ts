import type { RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { requestRtPage } from "./rotten-page";
import { parseScorecard } from "./rotten-scorecard";
import {
  readSnapshot,
  readUniqueSnapshot,
  removeSnapshot,
  writeSnapshot,
} from "./rotten-snapshot";
import {
  cacheRtTarget,
  getCachedRtTarget,
  invalidateRtTarget,
  resolveRtTarget,
} from "./rotten-target";
import type { ResolvedRtTarget, RtTargetResult } from "./rotten-target";
import { TARGET_REVALIDATION_INTERVAL } from "./verified-target-cache";

type RtResolution = {
  rating: RtRating | null;
  status:
    | "aborted"
    | "cached"
    | "error"
    | "identity-conflict"
    | "missing-mapping"
    | "no-rating"
    | "refreshed"
    | "season-unmatched"
    | "stale";
};

type OnRtResolution = (result: RtResolution) => void;

const ratingFailure = (
  status: RtResolution["status"],
  rating: RtRating | null = null
): RtResolution => ({ rating, status });

const getSnapshotObject = (
  context: ResolutionContext,
  rtId: string
): RtRating["object"] => ({
  kind: context.kind,
  rtId,
  subjectId: context.subjectId,
});

const loadRating = async (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  object: RtRating["object"],
  prior: RtRating | null,
  signal: AbortSignal,
  onResult?: OnRtResolution
): Promise<RtResolution> => {
  if (prior && !prior.stale) {
    const result = { rating: prior, status: "cached" } satisfies RtResolution;
    onResult?.(result);
    return result;
  }
  if (prior) {
    onResult?.({ rating: prior, status: "stale" });
  }

  const page = await requestRtPage(target.rtId, signal);
  if (signal.aborted) {
    return ratingFailure("aborted");
  }
  const parsed = parseScorecard(page.html, {
    fetchedAt: Date.now(),
    kind: context.kind,
    rtId: target.rtId,
    season: context.season,
    seriesRtId: target.seriesRtId,
    subjectId: context.subjectId,
    url: page.url,
  });
  if (parsed.status === "invalid-page") {
    if (prior) {
      return { rating: prior, status: "stale" };
    }
    return ratingFailure("error");
  }
  if (parsed.status === "identity-conflict") {
    return ratingFailure("identity-conflict");
  }
  if (parsed.status === "no-rating") {
    removeSnapshot(object);
    return ratingFailure("no-rating");
  }
  writeSnapshot(parsed.rating);
  return { rating: parsed.rating, status: "refreshed" };
};

const fallbackSnapshot = (
  context: ResolutionContext,
  object: RtRating["object"] | null,
  prior: RtRating | null,
  onResult?: OnRtResolution
): RtResolution => {
  const rating =
    prior ??
    (object === null
      ? readUniqueSnapshot(context.subjectId, context.kind)
      : readSnapshot(object));
  if (!rating) {
    return ratingFailure("error");
  }
  const result = { rating, status: "stale" } satisfies RtResolution;
  onResult?.(result);
  return result;
};

const isConfirmedRatingStatus = (status: RtResolution["status"]): boolean =>
  status === "cached" ||
  status === "no-rating" ||
  status === "refreshed" ||
  status === "stale";

const refreshCachedTarget = async (
  context: ResolutionContext,
  priorTarget: ResolvedRtTarget,
  signal: AbortSignal,
  onResult?: OnRtResolution
): Promise<void> => {
  let freshTarget: RtTargetResult;
  try {
    freshTarget = await resolveRtTarget(context, signal, true);
  } catch {
    return;
  }
  if (signal.aborted) {
    return;
  }

  const priorObject = getSnapshotObject(context, priorTarget.rtId);
  if ("failure" in freshTarget) {
    if (freshTarget.failure === "error") {
      return;
    }
    invalidateRtTarget(context);
    removeSnapshot(priorObject);
    onResult?.(ratingFailure(freshTarget.failure));
    return;
  }

  if (
    freshTarget.rtId === priorTarget.rtId &&
    freshTarget.seriesRtId === priorTarget.seriesRtId
  ) {
    cacheRtTarget(context, freshTarget);
    return;
  }

  invalidateRtTarget(context);
  removeSnapshot(priorObject);
  onResult?.(ratingFailure("identity-conflict"));

  const object = getSnapshotObject(context, freshTarget.rtId);
  const prior = readSnapshot(object);
  const result = await loadRating(context, freshTarget, object, prior, signal);
  if (isConfirmedRatingStatus(result.status)) {
    cacheRtTarget(context, freshTarget);
  }
  if (!signal.aborted) {
    onResult?.(result);
  }
};

const fetchRtRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onResult?: OnRtResolution
): Promise<RtResolution> => {
  let object: RtRating["object"] | null = null;
  let prior: RtRating | null = null;
  try {
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
    if ("failure" in target) {
      if (target.failure === "error") {
        return fallbackSnapshot(context, null, null, onResult);
      }
      return ratingFailure(target.failure);
    }
    object = getSnapshotObject(context, target.rtId);
    prior = readSnapshot(object);
    if (
      cacheEntry?.status === "resolved" &&
      Date.now() - cacheEntry.verifiedAt >= TARGET_REVALIDATION_INTERVAL
    ) {
      void refreshCachedTarget(context, cacheEntry.target, signal, onResult);
    }
    const result = await loadRating(
      context,
      target,
      object,
      prior,
      signal,
      onResult
    );
    if (
      cacheEntry?.status !== "resolved" &&
      isConfirmedRatingStatus(result.status)
    ) {
      cacheRtTarget(context, target);
    }
    return result;
  } catch {
    if (signal.aborted) {
      return ratingFailure("aborted");
    }
    return fallbackSnapshot(context, object, prior, onResult);
  }
};

export { fetchRtRating };
export type { RtResolution };
