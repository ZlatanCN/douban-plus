import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { TARGET_REVALIDATION_INTERVAL } from "../shared/verified-target-cache";
import type { OnMcOutcome } from "./diagnostics";
import { fetchRatingForTarget, revalidateCachedTarget } from "./rating-fetch";
import { generationOf, sameTarget, targetObject } from "./rating-state";
import { report } from "./runtime-diagnostics";
import { readSnapshot, readUniqueSnapshot } from "./snapshot";
import type { MetacriticTarget } from "./wikidata/claims";

type OnCachedMcRating = (rating: McRating | null) => void;

const refreshCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  prior: McRating | null,
  signal: AbortSignal,
  onUpdate?: OnCachedMcRating,
  onOutcome?: OnMcOutcome
): Promise<McRating | null> => {
  const freshTarget = await revalidateCachedTarget(
    context,
    cachedTarget,
    signal,
    onOutcome
  );
  if (signal.aborted) {
    report(
      onOutcome,
      "cancelled",
      "mapping",
      cachedTarget.metacriticId,
      "aborted"
    );
    return prior;
  }
  if (!freshTarget) {
    report(
      onOutcome,
      "mapping-missing",
      "mapping",
      cachedTarget.metacriticId,
      "mc-target-missing"
    );
    onUpdate?.(null);
    return null;
  }
  const changed = !sameTarget(freshTarget, cachedTarget);
  if (changed) {
    onUpdate?.(null);
  } else if (prior && !prior.stale) {
    report(
      onOutcome,
      "rating",
      "cache",
      freshTarget.metacriticId,
      null,
      prior.fetchedAt
    );
    return prior;
  }

  const rating = await fetchRatingForTarget(
    context,
    freshTarget,
    signal,
    onOutcome
  );
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
  onUpdate?: OnCachedMcRating,
  onOutcome?: OnMcOutcome
): Promise<McRating | null> => {
  const prior = readSnapshot(targetObject(context, target));
  const shouldRevalidate =
    Date.now() - verifiedAt >= TARGET_REVALIDATION_INTERVAL;
  if (prior) {
    onUpdate?.(prior);
    if (prior.stale || shouldRevalidate) {
      return refreshCachedTarget(
        context,
        target,
        prior,
        signal,
        onUpdate,
        onOutcome
      );
    }
    report(
      onOutcome,
      "rating",
      "cache",
      target.metacriticId,
      null,
      prior.fetchedAt
    );
    return prior;
  }
  const currentTarget = shouldRevalidate
    ? await revalidateCachedTarget(context, target, signal, onOutcome)
    : target;
  if (!currentTarget || signal.aborted) {
    if (signal.aborted) {
      report(onOutcome, "cancelled", "mapping", target.metacriticId, "aborted");
    }
    return null;
  }
  const generation = generationOf(context);
  const rating = await fetchRatingForTarget(
    context,
    currentTarget,
    signal,
    onOutcome
  );
  return generationOf(context) === generation
    ? rating
    : readUniqueSnapshot(context.subjectId, context.kind, context.season);
};

export { fallbackSnapshot, fetchCachedTargetRating };
export type { OnCachedMcRating };
