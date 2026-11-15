import { createVerifiedTargetCache } from "@/modules/subject/api/external-ratings/shared/verified-target-cache";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { entityKind, readMetacriticId } from "./claims";
import type { Entity, MetacriticTarget, TargetResult } from "./claims";
import { findEntity } from "./lookup";
import type { LookupResult } from "./lookup";
import { resolveSeasonTarget } from "./season";

type MetacriticTargetResolution =
  | { complete: boolean; status: "error" | "missing" | "ambiguous" }
  | { complete: boolean; status: "matched"; target: MetacriticTarget };

const targetCache = createVerifiedTargetCache<MetacriticTarget>(
  "dp:metacritic-targets:v1"
);

const resolveEntity = (
  entity: Entity,
  context: ResolutionContext,
  signal: AbortSignal
): TargetResult | Promise<TargetResult> => {
  const kind = entityKind(entity);
  if (context.kind === "movie") {
    if (kind !== "movie") {
      return { status: "ambiguous" };
    }
    const metacritic = readMetacriticId(entity);
    if (metacritic.status !== "matched") {
      return metacritic;
    }
    return metacritic.metacriticId.startsWith("movie/")
      ? {
          kind: "movie",
          metacriticId: metacritic.metacriticId,
          season: null,
          seriesId: null,
          status: "matched",
        }
      : { status: "ambiguous" };
  }
  if (context.kind === "series") {
    if (kind !== null && kind !== "series") {
      return { status: "ambiguous" };
    }
    const metacritic = readMetacriticId(entity);
    if (metacritic.status !== "matched") {
      return metacritic;
    }
    return metacritic.metacriticId.startsWith("tv/") &&
      !metacritic.metacriticId.includes("/season-")
      ? {
          kind: "series",
          metacriticId: metacritic.metacriticId,
          season: null,
          seriesId: entity.id,
          status: "matched",
        }
      : { status: "ambiguous" };
  }
  if (context.season === null) {
    return { status: "ambiguous" };
  }
  return resolveSeasonTarget(entity, kind, context.season, signal);
};

const resolveIdentifier = async (
  property: "P345" | "P4529",
  value: string,
  context: ResolutionContext,
  signal: AbortSignal
): Promise<TargetResult> => {
  const lookup: LookupResult = await findEntity(property, value, signal);
  if (lookup.status !== "matched") {
    return lookup;
  }
  return resolveEntity(lookup.entity, context, signal);
};

const resolveMetacriticTargetFresh = async (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<MetacriticTargetResolution> => {
  if (context.seasonConflict || context.unsupportedEpisode) {
    return { complete: true, status: "ambiguous" };
  }
  if (context.kind === "season" && context.season === null) {
    return { complete: true, status: "missing" };
  }
  const results = await Promise.allSettled([
    context.imdbId
      ? resolveIdentifier("P345", context.imdbId, context, signal)
      : Promise.resolve<TargetResult>({ status: "missing" }),
    context.subjectId
      ? resolveIdentifier("P4529", context.subjectId, context, signal)
      : Promise.resolve<TargetResult>({ status: "missing" }),
  ]);
  const hasRejectedLookup = results.some(
    (result) => result.status === "rejected"
  );
  const targets = results
    .filter(
      (result): result is PromiseFulfilledResult<TargetResult> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
  if (targets.some((target) => target.status === "ambiguous")) {
    return { complete: true, status: "ambiguous" };
  }
  const matches = targets.filter(
    (target): target is MetacriticTarget => target.status === "matched"
  );
  const uniqueTargets = new Map(
    matches.map((target) => [
      `${target.kind}:${target.metacriticId}:${target.seriesId ?? ""}`,
      target,
    ])
  );
  if (uniqueTargets.size > 1) {
    return { complete: true, status: "ambiguous" };
  }
  if (uniqueTargets.size === 0) {
    return {
      complete: !hasRejectedLookup,
      status: hasRejectedLookup ? "error" : "missing",
    };
  }
  const [target] = uniqueTargets.values();
  return target
    ? { complete: !hasRejectedLookup, status: "matched", target }
    : { complete: !hasRejectedLookup, status: "missing" };
};

const resolveMetacriticTarget = async (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<MetacriticTarget | null> => {
  const cached = targetCache.get(context);
  if (cached?.status === "resolved") {
    return cached.target;
  }
  const result = await resolveMetacriticTargetFresh(context, signal);
  return result.status === "matched" ? result.target : null;
};

const getCachedMetacriticTarget = targetCache.get;
const cacheMetacriticTarget = targetCache.set;
const invalidateMetacriticTarget = targetCache.invalidate;

export {
  cacheMetacriticTarget,
  getCachedMetacriticTarget,
  invalidateMetacriticTarget,
  resolveMetacriticTarget,
  resolveMetacriticTargetFresh,
  type MetacriticTargetResolution,
};
