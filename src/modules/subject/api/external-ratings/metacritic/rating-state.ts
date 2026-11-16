import type { McObject } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { removeSnapshot, removeSnapshotsForContext } from "./snapshot";
import type { MetacriticTarget } from "./wikidata/claims";
import { invalidateMetacriticTarget } from "./wikidata/resolve";

const ratingGenerations = new Map<string, number>();

const contextKey = (context: ResolutionContext): string =>
  JSON.stringify([
    context.subjectId,
    context.imdbId,
    context.kind,
    context.season,
  ]);

const generationOf = (context: ResolutionContext): number =>
  ratingGenerations.get(contextKey(context)) ?? 0;

const invalidateRatingTarget = (
  context: ResolutionContext,
  object?: McObject
): void => {
  invalidateMetacriticTarget(context);
  ratingGenerations.set(contextKey(context), generationOf(context) + 1);
  if (object) {
    removeSnapshot(object);
  } else {
    removeSnapshotsForContext(context.subjectId, context.kind, context.season);
  }
};

const removeRatingSnapshot = (
  context: ResolutionContext,
  object: McObject
): void => {
  ratingGenerations.set(contextKey(context), generationOf(context) + 1);
  removeSnapshot(object);
};

const targetObject = (
  context: ResolutionContext,
  target: MetacriticTarget
): McObject => ({
  kind: target.kind,
  metacriticId: target.metacriticId,
  season: target.season,
  seriesId: target.seriesId,
  seriesMetacriticId: target.seriesMetacriticId,
  subjectId: context.subjectId,
});

const sameTarget = (left: MetacriticTarget, right: MetacriticTarget): boolean =>
  left.kind === right.kind &&
  left.metacriticId === right.metacriticId &&
  left.season === right.season &&
  left.seriesId === right.seriesId &&
  left.seriesMetacriticId === right.seriesMetacriticId &&
  JSON.stringify(left.identityReferences) ===
    JSON.stringify(right.identityReferences);

export {
  generationOf,
  invalidateRatingTarget,
  removeRatingSnapshot,
  sameTarget,
  targetObject,
};
