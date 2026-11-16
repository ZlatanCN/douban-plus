import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { fallbackSnapshot, fetchCachedTargetRating } from "./cached-rating";
import type { OnCachedMcRating } from "./cached-rating";
import type { OnMcOutcome } from "./diagnostics";
import { fetchRatingForTarget } from "./rating-fetch";
import {
  generationOf,
  invalidateRatingTarget,
  targetObject,
} from "./rating-state";
import {
  failureReasonFromError,
  report,
  withResolutionEvidence,
} from "./runtime-diagnostics";
import { readSnapshot, readUniqueSnapshot } from "./snapshot";
import { finishSeasonLinkResolution } from "./target-resolution";
import {
  cacheMetacriticTarget,
  getCachedMetacriticTarget,
  resolveMetacriticTarget,
} from "./wikidata/resolve";

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
  const reportOutcome = onOutcome
    ? (diagnostic: ExternalRatingDiagnostic) =>
        onOutcome(withResolutionEvidence(diagnostic, resolution))
    : undefined;
  if (signal.aborted) {
    report(reportOutcome, "cancelled", "mapping", null, "aborted");
    return null;
  }
  if (!resolution.complete || resolution.status === "error") {
    report(
      reportOutcome,
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
      reportOutcome,
      "identity-conflict",
      "identity",
      null,
      "mc-identity-conflict"
    );
    return null;
  }
  if (resolution.status === "missing" || resolution.status === "ambiguous") {
    report(
      reportOutcome,
      "mapping-missing",
      "mapping",
      null,
      "mc-mapping-missing"
    );
    return fallbackSnapshot(context, onUpdate);
  }
  if (resolution.status !== "matched") {
    report(
      reportOutcome,
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
        reportOutcome,
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
      reportOutcome
    );
    const result =
      generationOf(context) === generation
        ? refreshed
        : readUniqueSnapshot(context.subjectId, context.kind, context.season);
    onUpdate?.(result);
    return result;
  }
  const generation = generationOf(context);
  const rating = await fetchRatingForTarget(
    context,
    target,
    signal,
    reportOutcome
  );
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
