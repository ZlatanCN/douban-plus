import type { McRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { readMcPage } from "./page";
import {
  identityNamesForAlias,
  METACRITIC_ORIGIN,
  readVerifiedSeasonPage,
  requestMcPage,
} from "./page-request";
import {
  generationOf,
  invalidateRatingTarget,
  removeRatingSnapshot,
  sameTarget,
  targetObject,
} from "./rating-state";
import { readSnapshot, writeSnapshot } from "./snapshot";
import { finishSeasonLinkResolution } from "./target-resolution";
import type { MetacriticTarget } from "./wikidata/claims";
import {
  cacheMetacriticTarget,
  resolveMetacriticTargetFresh,
} from "./wikidata/resolve";
import type { MetacriticTargetResolution } from "./wikidata/resolve";

const fetchRatingForTarget = async (
  context: ResolutionContext,
  target: MetacriticTarget,
  signal: AbortSignal
): Promise<McRating | null> => {
  const object = targetObject(context, target);
  const prior = readSnapshot(object);
  if (prior && !prior.stale) {
    cacheMetacriticTarget(context, target);
    return prior;
  }
  const generation = generationOf(context);
  let response;
  try {
    response = await requestMcPage(
      `${METACRITIC_ORIGIN}/${target.metacriticId}/`,
      signal
    );
  } catch {
    return prior;
  }
  if (signal.aborted || generationOf(context) !== generation) {
    return readSnapshot(object);
  }
  const identityNames = await identityNamesForAlias(
    response.responseText,
    target,
    signal
  );
  if (signal.aborted || generationOf(context) !== generation) {
    return readSnapshot(object);
  }
  const page =
    target.kind === "season"
      ? await readVerifiedSeasonPage(
          context,
          response,
          target,
          identityNames,
          signal
        )
      : readMcPage(response.responseText, target, {
          ...(target.seriesMetacriticId
            ? { expectedSeriesUrl: target.seriesMetacriticId }
            : {}),
          finalUrl: response.finalUrl,
          identityNames: identityNames.names,
          identityNamesComplete: identityNames.complete,
          identityEvidence: context.identityEvidence,
        });
  if (page.matchesTarget === false) {
    if (page.reason === "identity-conflict") {
      invalidateRatingTarget(context, object);
    }
    return page.reason === "invalid-page" ? prior : null;
  }
  cacheMetacriticTarget(context, target);
  if (page.ratingStatus === "invalid-page") {
    return prior;
  }
  if (page.ratingStatus === "no-rating") {
    removeRatingSnapshot(context, object);
    return null;
  }
  if (!page.rating) {
    return prior;
  }
  const rating: McRating = {
    ...page.rating,
    fetchedAt: Date.now(),
    object,
    stale: false,
  };
  if (generationOf(context) !== generation) {
    return readSnapshot(object);
  }
  writeSnapshot(rating);
  return rating;
};

const revalidateCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  signal: AbortSignal
): Promise<MetacriticTarget | null> => {
  let resolution: MetacriticTargetResolution;
  try {
    resolution = await finishSeasonLinkResolution(
      context,
      await resolveMetacriticTargetFresh(context, signal),
      signal
    );
  } catch {
    return cachedTarget;
  }
  if (
    !resolution.complete ||
    signal.aborted ||
    resolution.status === "error" ||
    resolution.status === "ambiguous" ||
    resolution.status === "missing"
  ) {
    return cachedTarget;
  }
  if (
    resolution.status === "matched" &&
    sameTarget(resolution.target, cachedTarget)
  ) {
    cacheMetacriticTarget(context, cachedTarget);
    return cachedTarget;
  }
  const priorObject = targetObject(context, cachedTarget);
  if (resolution.status === "identity-conflict") {
    invalidateRatingTarget(context, priorObject);
    return null;
  }
  invalidateRatingTarget(context, priorObject);
  return resolution.status === "matched" ? resolution.target : null;
};

export { fetchRatingForTarget, revalidateCachedTarget };
