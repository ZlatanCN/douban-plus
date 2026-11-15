import type { ResolutionContext } from "@/modules/subject/resolve/types";
import { createCache } from "@/shared/utils/cache";

import { isRtSeriesPage, requestRtPage } from "./rotten-page";
import { findSeasonPath } from "./rotten-parser";
import { resolveRottenMapping } from "./rotten-wikidata";

type ResolvedRtTarget = { rtId: string; seriesRtId: string | null };
type TargetFailure =
  | "aborted"
  | "error"
  | "identity-conflict"
  | "missing-mapping"
  | "season-unmatched";
type RtTargetResult = ResolvedRtTarget | { failure: TargetFailure };
type CachedRtTarget =
  | { status: "resolved"; target: ResolvedRtTarget; verifiedAt: number }
  | { status: "invalidated" };

const TARGET_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const TARGET_REVALIDATION_INTERVAL = 24 * 60 * 60 * 1000;
const rtTargetCache = createCache<CachedRtTarget>(
  "dp:rotten-targets:v1",
  TARGET_CACHE_TTL
);

const targetCacheKey = (context: ResolutionContext): string =>
  JSON.stringify([
    context.subjectId,
    context.imdbId,
    context.kind,
    context.season,
  ]);

const getCachedRtTarget = (context: ResolutionContext): CachedRtTarget | null =>
  rtTargetCache.get(targetCacheKey(context)) ?? null;

const cacheRtTarget = (
  context: ResolutionContext,
  target: ResolvedRtTarget
): void => {
  rtTargetCache.set(targetCacheKey(context), {
    status: "resolved",
    target,
    verifiedAt: Date.now(),
  });
};

const invalidateRtTarget = (context: ResolutionContext): void => {
  rtTargetCache.set(targetCacheKey(context), { status: "invalidated" });
};

const resolveRtTarget = async (
  context: ResolutionContext,
  signal: AbortSignal,
  refresh = false
): Promise<RtTargetResult> => {
  if (!context.subjectId) {
    return { failure: "missing-mapping" };
  }
  if (context.seasonConflict || context.unsupportedEpisode) {
    return { failure: "season-unmatched" };
  }
  if (!refresh) {
    const cached = getCachedRtTarget(context);
    if (cached?.status === "resolved") {
      return cached.target;
    }
  }

  const mapping = await resolveRottenMapping(context, signal);
  if (signal.aborted) {
    return { failure: "aborted" };
  }
  if (mapping.status === "unavailable") {
    if (mapping.reason === "conflict") {
      return { failure: "identity-conflict" };
    }
    if (mapping.reason === "season") {
      return { failure: "season-unmatched" };
    }
    if (mapping.reason === "error") {
      return { failure: "error" };
    }
    return { failure: "missing-mapping" };
  }

  if (!mapping.needsSeasonLink) {
    return { rtId: mapping.rtId, seriesRtId: mapping.seriesRtId };
  }
  const seriesPage = await requestRtPage(mapping.rtId, signal);
  if (signal.aborted) {
    return { failure: "aborted" };
  }
  if (!isRtSeriesPage(seriesPage.html, mapping.rtId)) {
    return { failure: "identity-conflict" };
  }
  if (context.season === null) {
    return { failure: "season-unmatched" };
  }
  const seasonPath = findSeasonPath(
    seriesPage.html,
    mapping.rtId,
    context.season
  );
  return seasonPath
    ? { rtId: seasonPath, seriesRtId: mapping.seriesRtId }
    : { failure: "season-unmatched" };
};

export {
  TARGET_REVALIDATION_INTERVAL,
  cacheRtTarget,
  getCachedRtTarget,
  invalidateRtTarget,
  resolveRtTarget,
};
export type { CachedRtTarget, ResolvedRtTarget, RtTargetResult };
