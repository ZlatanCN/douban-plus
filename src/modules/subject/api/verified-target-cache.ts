import type { ResolutionContext } from "@/modules/subject/resolve/types";
import { createCache } from "@/shared/utils/cache";

type VerifiedTargetCacheEntry<T> =
  | { status: "resolved"; target: T; verifiedAt: number }
  | { status: "invalidated" };

const TARGET_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const TARGET_REVALIDATION_INTERVAL = 24 * 60 * 60 * 1000;

const targetCacheKey = (context: ResolutionContext): string =>
  JSON.stringify([
    context.subjectId,
    context.imdbId,
    context.kind,
    context.season,
  ]);

const createVerifiedTargetCache = <T>(storageKey: string) => {
  const cache = createCache<VerifiedTargetCacheEntry<T>>(
    storageKey,
    TARGET_CACHE_TTL
  );
  return {
    get: (context: ResolutionContext): VerifiedTargetCacheEntry<T> | null =>
      cache.get(targetCacheKey(context)) ?? null,
    invalidate: (context: ResolutionContext): void => {
      cache.set(targetCacheKey(context), { status: "invalidated" });
    },
    set: (context: ResolutionContext, target: T): void => {
      cache.set(targetCacheKey(context), {
        status: "resolved",
        target,
        verifiedAt: Date.now(),
      });
    },
  };
};

export {
  createVerifiedTargetCache,
  TARGET_REVALIDATION_INTERVAL,
  type VerifiedTargetCacheEntry,
};
