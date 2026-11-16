import { createVerifiedTargetCache } from "@/modules/subject/api/external-ratings/shared/verified-target-cache";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { entityKind, identityReferences, readMetacriticId } from "./claims";
import type { Entity, MetacriticTarget, TargetResult } from "./claims";
import { findEntity } from "./lookup";
import type { LookupResult } from "./lookup";
import { resolveSeasonTarget } from "./season";

type MetacriticTargetResolution =
  | {
      complete: boolean;
      season: number;
      seriesTarget: MetacriticTarget;
      status: "season-link-needed";
    }
  | {
      complete: boolean;
      status: "ambiguous" | "error" | "identity-conflict" | "missing";
    }
  | { complete: boolean; status: "matched"; target: MetacriticTarget };

const targetCache = createVerifiedTargetCache<MetacriticTarget>(
  "dp:metacritic-targets:v4"
);

const resolveEntity = async (
  entity: Entity,
  context: ResolutionContext,
  signal: AbortSignal
): Promise<TargetResult> => {
  const kind = await entityKind(entity, signal);
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
          identityReferences: identityReferences(entity),
          metacriticId: metacritic.metacriticId,
          season: null,
          seriesId: null,
          seriesMetacriticId: null,
          status: "matched",
        }
      : { status: "ambiguous" };
  }
  if (context.kind === "series") {
    if (kind !== "series") {
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
          identityReferences: identityReferences(entity),
          metacriticId: metacritic.metacriticId,
          season: null,
          seriesId: entity.id,
          seriesMetacriticId: metacritic.metacriticId,
          status: "matched",
        }
      : { status: "ambiguous" };
  }
  if (context.season === null) {
    return { status: "ambiguous" };
  }
  if (kind === null) {
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
    return { complete: true, status: "identity-conflict" };
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
  const seasonLinks = targets.filter(
    (
      target
    ): target is Extract<TargetResult, { status: "season-link-needed" }> =>
      target.status === "season-link-needed"
  );
  const uniqueTargets = new Map(
    matches.map((target) => [
      `${target.kind}:${target.metacriticId}:${target.seriesId ?? ""}:${target.seriesMetacriticId ?? ""}`,
      target,
    ])
  );
  if (uniqueTargets.size > 1) {
    return { complete: true, status: "identity-conflict" };
  }
  const uniqueSeasonLinks = new Map(
    seasonLinks.map((result) => [
      `${result.season}:${result.seriesTarget.seriesId ?? ""}:${result.seriesTarget.metacriticId}`,
      result,
    ])
  );
  if (uniqueSeasonLinks.size > 1) {
    return { complete: true, status: "identity-conflict" };
  }
  const [matchedTarget] = uniqueTargets.values();
  const [seasonLink] = uniqueSeasonLinks.values();
  if (matchedTarget && seasonLink) {
    if (
      matchedTarget.kind !== "season" ||
      matchedTarget.season !== seasonLink.season ||
      matchedTarget.seriesId !== seasonLink.seriesTarget.seriesId
    ) {
      return { complete: true, status: "identity-conflict" };
    }
    return {
      complete: !hasRejectedLookup,
      status: "matched",
      target: matchedTarget,
    };
  }
  if (uniqueTargets.size === 0) {
    if (seasonLink) {
      return { complete: !hasRejectedLookup, ...seasonLink };
    }
    return {
      complete: !hasRejectedLookup,
      status: hasRejectedLookup ? "error" : "missing",
    };
  }
  return matchedTarget
    ? { complete: !hasRejectedLookup, status: "matched", target: matchedTarget }
    : { complete: !hasRejectedLookup, status: "missing" };
};

const resolveMetacriticTarget = (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<MetacriticTargetResolution> => {
  const cached = targetCache.get(context);
  if (cached?.status === "resolved") {
    return Promise.resolve({
      complete: true,
      status: "matched",
      target: cached.target,
    });
  }
  return resolveMetacriticTargetFresh(context, signal);
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
