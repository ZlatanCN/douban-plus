import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { TARGET_REVALIDATION_INTERVAL } from "../shared/verified-target-cache";
import { fetchRatingForTarget, revalidateCachedTarget } from "./rating-fetch";
import type { OnMcOutcome } from "./rating-fetch";
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
  onOutcome?.({
    cacheAgeMs: fetchedAt === null ? null : Math.max(0, Date.now() - fetchedAt),
    errorCode,
    reason,
    stage,
    target,
  });
};

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

const fetchFreshMappedRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onUpdate?: OnCachedMcRating,
  onOutcome?: OnMcOutcome
): Promise<McRating | null> => {
  const resolution = await finishSeasonLinkResolution(
    context,
    await resolveMetacriticTarget(context, signal),
    signal
  );
  if (signal.aborted) {
    report(onOutcome, "cancelled", "mapping", null, "aborted");
    return null;
  }
  if (!resolution.complete || resolution.status === "error") {
    report(
      onOutcome,
      resolution.failure ?? "request-error",
      "mapping",
      null,
      resolution.failure ?? "mc-target-resolution"
    );
    return fallbackSnapshot(context, onUpdate);
  }
  if (resolution.status === "identity-conflict") {
    invalidateRatingTarget(context);
    report(
      onOutcome,
      "identity-conflict",
      "identity",
      null,
      "mc-identity-conflict"
    );
    return null;
  }
  if (resolution.status === "missing" || resolution.status === "ambiguous") {
    report(onOutcome, "mapping-missing", "mapping", null, "mc-mapping-missing");
    return fallbackSnapshot(context, onUpdate);
  }
  if (resolution.status !== "matched") {
    report(
      onOutcome,
      "mapping-missing",
      "mapping",
      null,
      "mc-season-unresolved"
    );
    return null;
  }
  const { target } = resolution;
  const prior = readSnapshot(targetObject(context, target));
  if (prior) {
    cacheMetacriticTarget(context, target);
    onUpdate?.(prior);
    if (!prior.stale) {
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
    const generation = generationOf(context);
    const refreshed = await fetchRatingForTarget(
      context,
      target,
      signal,
      onOutcome
    );
    const result =
      generationOf(context) === generation
        ? refreshed
        : readUniqueSnapshot(context.subjectId, context.kind, context.season);
    onUpdate?.(result);
    return result;
  }
  const generation = generationOf(context);
  const rating = await fetchRatingForTarget(context, target, signal, onOutcome);
  return generationOf(context) === generation
    ? rating
    : readUniqueSnapshot(context.subjectId, context.kind, context.season);
};

const fetchMcRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onCachedUpdate?: OnCachedMcRating,
  onOutcome?: OnMcOutcome
): Promise<McRating | null> => {
  if (
    context.seasonConflict ||
    context.unsupportedEpisode ||
    (context.kind === "season" && context.season === null)
  ) {
    report(
      onOutcome,
      "mapping-missing",
      "mapping",
      null,
      "unsupported-identity"
    );
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
        onCachedUpdate,
        onOutcome
      );
    }
    return await fetchFreshMappedRating(
      context,
      signal,
      onCachedUpdate,
      onOutcome
    );
  } catch (error) {
    const reason = failureReasonFromError(error, signal);
    const errorCode = signal.aborted ? "aborted" : "mc-resolution";
    report(onOutcome, reason, "mapping", null, errorCode);
    return signal.aborted ? null : fallbackSnapshot(context, onCachedUpdate);
  }
};

export { fetchMcRating };
