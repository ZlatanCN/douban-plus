import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { entityKind, identityReferences, readMetacriticId } from "./claims";
import type { Entity, TargetResult } from "./claims";
import { findEntity } from "./lookup";
import type { LookupResult } from "./lookup";
import { resolveSeasonTarget } from "./season";
import type { IdentifierResult, ResolutionEvidence } from "./types";

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
  if (context.season === null || kind === null) {
    return { status: "ambiguous" };
  }
  return resolveSeasonTarget(entity, kind, context.season, signal);
};

const resolveIdentifier = async (
  property: "P345" | "P4529",
  value: string,
  context: ResolutionContext,
  signal: AbortSignal
): Promise<IdentifierResult> => {
  const lookup: LookupResult = await findEntity(property, value, signal);
  const evidence: ResolutionEvidence = {
    acceptedEvidence: [],
    candidateTargets: lookup.candidateTargets,
    missingEvidence: [],
    rejectedEvidence: [],
    unverifiedEvidence: [],
  };
  if (lookup.status !== "matched") {
    return {
      evidence: {
        ...evidence,
        missingEvidence: ["exact-id"],
        unverifiedEvidence: ["type", "canonical", "aggregate-rating"],
      },
      target: lookup,
    };
  }
  const target = await resolveEntity(lookup.entity, context, signal);
  const acceptedEvidence = [
    "exact-id" as const,
    ...(target.status === "matched" ||
    target.status === "missing" ||
    target.status === "season-link-needed"
      ? (["type"] as const)
      : []),
  ];
  if (target.status === "missing") {
    return {
      evidence: {
        ...evidence,
        acceptedEvidence,
        missingEvidence: ["exact-id"],
        unverifiedEvidence: ["canonical", "aggregate-rating"],
      },
      target,
    };
  }
  if (target.status === "ambiguous") {
    return {
      evidence: { ...evidence, acceptedEvidence, rejectedEvidence: ["type"] },
      target,
    };
  }
  return { evidence: { ...evidence, acceptedEvidence }, target };
};

export { resolveIdentifier };
