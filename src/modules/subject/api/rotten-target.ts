import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { isRtSeriesPage, requestRtPage } from "./rotten-page";
import { findSeasonPath } from "./rotten-parser";
import { resolveRottenMapping } from "./rotten-wikidata";
import { createVerifiedTargetCache } from "./verified-target-cache";

type ResolvedRtTarget = { rtId: string; seriesRtId: string | null };
type TargetFailure =
  | "aborted"
  | "error"
  | "identity-conflict"
  | "missing-mapping"
  | "season-unmatched";
type RtTargetResult = ResolvedRtTarget | { failure: TargetFailure };
const rtTargetCache = createVerifiedTargetCache<ResolvedRtTarget>(
  "dp:rotten-targets:v1"
);

const getCachedRtTarget = rtTargetCache.get;
const cacheRtTarget = rtTargetCache.set;
const invalidateRtTarget = rtTargetCache.invalidate;

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
  cacheRtTarget,
  getCachedRtTarget,
  invalidateRtTarget,
  resolveRtTarget,
};
export type { ResolvedRtTarget, RtTargetResult };
