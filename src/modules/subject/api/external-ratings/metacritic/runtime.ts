import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { TARGET_REVALIDATION_INTERVAL } from "../shared/verified-target-cache";
import { fetchRatingForTarget, revalidateCachedTarget } from "./rating-fetch";
import {
  generationOf,
  invalidateRatingTarget,
  sameTarget,
  targetObject,
} from "./rating-state";
import { readSnapshot, readUniqueSnapshot } from "./snapshot";
import { finishSeasonLinkResolution } from "./target-resolution";
import type { MetacriticTarget } from "./wikidata/claims";
import {
  cacheMetacriticTarget,
  getCachedMetacriticTarget,
  resolveMetacriticTarget,
} from "./wikidata/resolve";

type OnCachedMcRating = (rating: McRating | null) => void;

const refreshCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  prior: McRating | null,
  signal: AbortSignal,
  onUpdate?: OnCachedMcRating
): Promise<McRating | null> => {
  const freshTarget = await revalidateCachedTarget(
    context,
    cachedTarget,
    signal
  );
  if (signal.aborted) {
    return prior;
  }
  if (!freshTarget) {
    onUpdate?.(null);
    return null;
  }
  const changed = !sameTarget(freshTarget, cachedTarget);
  if (changed) {
    onUpdate?.(null);
  } else if (prior && !prior.stale) {
    return prior;
  }

  const rating = await fetchRatingForTarget(context, freshTarget, signal);
  if (!signal.aborted) {
    onUpdate?.(rating);
  }
  return rating;
};

const fallbackSnapshot = (
  context: ResolutionContext,
  onUpdate?: OnCachedMcRating
): McRating | null => {
  const snapshot = readUniqueSnapshot(
    context.subjectId,
    context.kind,
    context.season
  );
  if (snapshot) {
    onUpdate?.(snapshot);
  }
  return snapshot;
};

const fetchCachedTargetRating = async (
  context: ResolutionContext,
  target: MetacriticTarget,
  verifiedAt: number,
  signal: AbortSignal,
  onUpdate?: OnCachedMcRating
): Promise<McRating | null> => {
  const prior = readSnapshot(targetObject(context, target));
  const shouldRevalidate =
    Date.now() - verifiedAt >= TARGET_REVALIDATION_INTERVAL;
  if (prior) {
    onUpdate?.(prior);
    return prior.stale || shouldRevalidate
      ? refreshCachedTarget(context, target, prior, signal, onUpdate)
      : prior;
  }
  const currentTarget = shouldRevalidate
    ? await revalidateCachedTarget(context, target, signal)
    : target;
  if (!currentTarget || signal.aborted) {
    return null;
  }
  const generation = generationOf(context);
  const rating = await fetchRatingForTarget(context, currentTarget, signal);
  return generationOf(context) === generation
    ? rating
    : readUniqueSnapshot(context.subjectId, context.kind, context.season);
};

const fetchFreshMappedRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onUpdate?: OnCachedMcRating
): Promise<McRating | null> => {
  const resolution = await finishSeasonLinkResolution(
    context,
    await resolveMetacriticTarget(context, signal),
    signal
  );
  if (signal.aborted) {
    return null;
  }
  if (!resolution.complete || resolution.status === "error") {
    return fallbackSnapshot(context, onUpdate);
  }
  if (resolution.status === "identity-conflict") {
    invalidateRatingTarget(context);
    return null;
  }
  if (resolution.status === "missing" || resolution.status === "ambiguous") {
    return fallbackSnapshot(context, onUpdate);
  }
  if (resolution.status !== "matched") {
    return null;
  }
  const { target } = resolution;
  const prior = readSnapshot(targetObject(context, target));
  if (prior) {
    cacheMetacriticTarget(context, target);
    onUpdate?.(prior);
    if (!prior.stale) {
      return prior;
    }
    const generation = generationOf(context);
    const refreshed = await fetchRatingForTarget(context, target, signal);
    const result =
      generationOf(context) === generation
        ? refreshed
        : readUniqueSnapshot(context.subjectId, context.kind, context.season);
    onUpdate?.(result);
    return result;
  }
  const generation = generationOf(context);
  const rating = await fetchRatingForTarget(context, target, signal);
  return generationOf(context) === generation
    ? rating
    : readUniqueSnapshot(context.subjectId, context.kind, context.season);
};

const fetchMcRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onCachedUpdate?: OnCachedMcRating
): Promise<McRating | null> => {
  if (
    context.seasonConflict ||
    context.unsupportedEpisode ||
    (context.kind === "season" && context.season === null)
  ) {
    return null;
  }
  try {
    const targetCacheEntry = getCachedMetacriticTarget(context);
    if (targetCacheEntry?.status === "resolved") {
      return await fetchCachedTargetRating(
        context,
        targetCacheEntry.target,
        targetCacheEntry.verifiedAt,
        signal,
        onCachedUpdate
      );
    }
    return await fetchFreshMappedRating(context, signal, onCachedUpdate);
  } catch {
    return signal.aborted ? null : fallbackSnapshot(context, onCachedUpdate);
  }
};

export { fetchMcRating };
