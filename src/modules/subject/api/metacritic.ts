import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";
import { createCache } from "@/shared/utils/cache";
import { gmGetResponse } from "@/shared/utils/request";

import { isMatchingMcPage, pagePath, parseMcPage } from "./metacritic-parser";
import {
  cacheMetacriticTarget,
  getCachedMetacriticTarget,
  invalidateMetacriticTarget,
  resolveMetacriticTarget,
  resolveMetacriticTargetFresh,
} from "./metacritic-wikidata";
import type { MetacriticTarget } from "./metacritic-wikidata-claims";
import { TARGET_REVALIDATION_INTERVAL } from "./verified-target-cache";

const METACRITIC_ORIGIN = "https://www.metacritic.com";
const REQUEST_TIMEOUT = 8000;
const mcCache = createCache<NonNullable<McRating>>(
  "dp:metacritic-cache-v2",
  7 * 24 * 60 * 60 * 1000
);

const cacheKey = (
  context: ResolutionContext,
  target: MetacriticTarget
): string =>
  [
    context.subjectId,
    target.kind,
    target.season === null ? "" : String(target.season),
    target.metacriticId,
  ].join(":");

const sameTarget = (left: MetacriticTarget, right: MetacriticTarget): boolean =>
  left.kind === right.kind &&
  left.metacriticId === right.metacriticId &&
  left.season === right.season &&
  left.seriesId === right.seriesId;

const fetchRatingForTarget = async (
  context: ResolutionContext,
  target: MetacriticTarget,
  signal: AbortSignal,
  cacheVerifiedTarget = false
): Promise<McRating | null> => {
  const key = cacheKey(context, target);
  const cached = mcCache.get(key);
  if (cached) {
    if (cacheVerifiedTarget) {
      cacheMetacriticTarget(context, target);
    }
    return cached;
  }
  const url = `${METACRITIC_ORIGIN}/${target.metacriticId}/`;
  const response = await gmGetResponse(url, `${METACRITIC_ORIGIN}/`, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  if (pagePath(response.finalUrl) !== `/${target.metacriticId}`) {
    invalidateMetacriticTarget(context);
    return null;
  }
  if (!isMatchingMcPage(response.responseText, target)) {
    invalidateMetacriticTarget(context);
    return null;
  }
  if (cacheVerifiedTarget) {
    cacheMetacriticTarget(context, target);
  }
  const rating = parseMcPage(response.responseText, target);
  if (!rating) {
    return null;
  }
  mcCache.set(key, rating);
  return rating;
};

type OnCachedMcRating = (rating: McRating | null) => void;

const revalidateCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  signal: AbortSignal
): Promise<MetacriticTarget | null> => {
  let resolution: Awaited<ReturnType<typeof resolveMetacriticTargetFresh>>;
  try {
    resolution = await resolveMetacriticTargetFresh(context, signal);
  } catch {
    return cachedTarget;
  }
  if (!resolution.complete || signal.aborted) {
    return cachedTarget;
  }
  if (
    resolution.status === "matched" &&
    sameTarget(resolution.target, cachedTarget)
  ) {
    cacheMetacriticTarget(context, cachedTarget);
    return cachedTarget;
  }
  invalidateMetacriticTarget(context);
  return resolution.status === "matched" ? resolution.target : null;
};

const refreshCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  signal: AbortSignal,
  onUpdate?: OnCachedMcRating
): Promise<void> => {
  const freshTarget = await revalidateCachedTarget(
    context,
    cachedTarget,
    signal
  );
  if (signal.aborted) {
    return;
  }
  if (!freshTarget) {
    onUpdate?.(null);
    return;
  }
  if (sameTarget(freshTarget, cachedTarget)) {
    return;
  }

  onUpdate?.(null);
  const rating = await fetchRatingForTarget(
    context,
    freshTarget,
    signal,
    true
  ).catch(() => null);
  if (!signal.aborted) {
    onUpdate?.(rating);
  }
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
      const { target } = targetCacheEntry;
      const shouldRevalidate =
        Date.now() - targetCacheEntry.verifiedAt >=
        TARGET_REVALIDATION_INTERVAL;
      const cachedRating = mcCache.get(cacheKey(context, target));
      if (cachedRating) {
        onCachedUpdate?.(cachedRating);
        if (shouldRevalidate) {
          void refreshCachedTarget(context, target, signal, onCachedUpdate);
        }
        return cachedRating;
      }
      const currentTarget = shouldRevalidate
        ? await revalidateCachedTarget(context, target, signal)
        : target;
      if (!currentTarget || signal.aborted) {
        return null;
      }
      return fetchRatingForTarget(context, currentTarget, signal, true);
    }

    const target = await resolveMetacriticTarget(context, signal);
    if (!target || signal.aborted) {
      return null;
    }
    return await fetchRatingForTarget(context, target, signal, true);
  } catch {
    return null;
  }
};

export { fetchMcRating };
