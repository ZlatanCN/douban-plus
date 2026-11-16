import { createVerifiedTargetCache } from "@/modules/subject/api/external-ratings/shared/verified-target-cache";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import type { MetacriticTarget } from "./claims";
import { resolveIdentifier } from "./resolve-identifier";
import { resolveIdentifierResults } from "./resolve-identifiers";
import type { IdentifierResult, MetacriticTargetResolution } from "./types";

type MissingIdentifierResult = {
  evidence: {
    acceptedEvidence: [];
    candidateTargets: [];
    missingEvidence: ["exact-id"];
    rejectedEvidence: [];
    unverifiedEvidence: ["type", "canonical", "aggregate-rating"];
  };
  target: { status: "missing" };
};

const missingIdentifierResult = (): MissingIdentifierResult => ({
  evidence: {
    acceptedEvidence: [],
    candidateTargets: [],
    missingEvidence: ["exact-id"],
    rejectedEvidence: [],
    unverifiedEvidence: ["type", "canonical", "aggregate-rating"],
  },
  target: { status: "missing" },
});

const targetCache = createVerifiedTargetCache<MetacriticTarget>(
  "dp:metacritic-targets:v4"
);

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
      : Promise.resolve<IdentifierResult>(missingIdentifierResult()),
    context.subjectId
      ? resolveIdentifier("P4529", context.subjectId, context, signal)
      : Promise.resolve<IdentifierResult>(missingIdentifierResult()),
  ]);
  return resolveIdentifierResults(results);
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
};
export type { MetacriticTargetResolution };
