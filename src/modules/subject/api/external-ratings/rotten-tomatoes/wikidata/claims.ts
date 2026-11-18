import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import { entityReference } from "@/modules/subject/api/external-ratings/shared/wikidata-client";
import {
  isFilmInstance,
  parseRottenTomatoesPath,
} from "@/modules/subject/api/external-ratings/shared/wikidata-identity";

import {
  SERIES_TYPES,
  activeIdentityClaims,
  claimValues,
  hasActiveIdentity,
  isDeprecatedIdentity,
  isSeriesEntity,
  readSeasonOrdinal,
} from "./identity-claims";
import type { Claim, Entity } from "./identity-claims";

type EntityMapping = {
  entity: Entity;
  kind: "movie" | "season" | "series";
  rtId: string;
  seriesRtId: string | null;
  seasonOrdinal: number | null;
  seasonOrdinalConflict: boolean;
};

type MappingEvidence = Pick<
  ExternalRatingDiagnostic,
  | "acceptedEvidence"
  | "candidateTargets"
  | "missingEvidence"
  | "rejectedEvidence"
  | "unverifiedEvidence"
>;

type IdentityLookup = (
  | {
      mappings: EntityMapping[];
      state: "ambiguous" | "deprecated" | "missing";
    }
  | {
      failure?: "parse-error" | "request-error";
      mappings: EntityMapping[];
      state: "error";
    }
  | { mappings: EntityMapping[]; state: "matched" }
) &
  Partial<MappingEvidence>;

type RottenMapping = (
  | {
      failure?: "parse-error" | "request-error";
      reason:
        | "ambiguous"
        | "conflict"
        | "deprecated"
        | "error"
        | "missing"
        | "season";
      status: "unavailable";
    }
  | {
      identityImdbIds?: string[];
      identityPersonIds?: string[];
      needsSeasonLink: boolean;
      rtId: string;
      seriesRtId: string | null;
      status: "matched";
    }
) &
  Partial<MappingEvidence>;

type EpisodeRtTarget =
  | { rtId: string; season: number; seriesRtId: string; status: "matched" }
  | { status: "ambiguous" | "missing" };

const SEASON_TYPES = new Set(["Q3464665"]);

const normalizeRtId = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    const url = new URL(value, "https://www.rottentomatoes.com/");
    if (
      url.hostname !== "www.rottentomatoes.com" &&
      url.hostname !== "rottentomatoes.com"
    ) {
      return null;
    }
    const path = url.pathname.replaceAll(/^\/+|\/+$/gu, "");
    return parseRottenTomatoesPath(path) ? path : null;
  } catch {
    return null;
  }
};

const entityKind = async (
  entity: Entity,
  rtId: string,
  signal: AbortSignal
): Promise<EntityMapping["kind"] | null> => {
  const path = parseRottenTomatoesPath(rtId);
  if (!path) {
    return null;
  }
  const types = claimValues(entity.claims?.P31)
    .map(entityReference)
    .filter((value): value is string => value !== null);
  if (path.kind === "movie" && (await isFilmInstance(types, signal))) {
    return "movie";
  }
  if (path.kind === "season" && types.some((id) => SEASON_TYPES.has(id))) {
    return "season";
  }
  if (path.kind === "series" && types.some((id) => SERIES_TYPES.has(id))) {
    return "series";
  }
  return null;
};

const readRtTarget = (
  entity: Entity
):
  | { rtId: string; status: "matched" }
  | { status: "ambiguous" | "deprecated" | "missing" } => {
  const activeClaims = claimValues(entity.claims?.P1258);
  const targets = activeClaims
    .map(normalizeRtId)
    .filter((target): target is string => target !== null);
  if (targets.length !== activeClaims.length) {
    return { status: "ambiguous" };
  }
  const uniqueTargets = new Set(targets);
  if (uniqueTargets.size > 1) {
    return { status: "ambiguous" };
  }
  const [rtId] = uniqueTargets;
  if (rtId) {
    return { rtId, status: "matched" };
  }
  const deprecated = (entity.claims?.P1258 ?? []).some(
    (claim) => claim.rank === "deprecated"
  );
  return { status: deprecated ? "deprecated" : "missing" };
};

const readEpisodeRtTarget = (entity: Entity): EpisodeRtTarget => {
  const activeClaims = claimValues(entity.claims?.P1258);
  if (activeClaims.length === 0) {
    return { status: "missing" };
  }
  const targets = activeClaims.map((value) => {
    if (typeof value !== "string") {
      return null;
    }
    const match = value.match(
      /^tv\/(?<series>[^/]+)\/s(?<season>\d{2,})\/e\d+$/u
    );
    const series = match?.groups?.series;
    const season = Number(match?.groups?.season);
    if (!series || !Number.isSafeInteger(season) || season <= 0) {
      return null;
    }
    return { rtId: value, season, seriesRtId: `tv/${series}` };
  });
  if (targets.some((target) => target === null)) {
    return { status: "ambiguous" };
  }
  const uniqueTargets = new Set(targets.map((target) => target?.rtId));
  const [target] = targets;
  if (uniqueTargets.size !== 1 || !target) {
    return { status: "ambiguous" };
  }
  return { ...target, status: "matched" };
};

export {
  activeIdentityClaims,
  claimValues,
  entityKind,
  hasActiveIdentity,
  isDeprecatedIdentity,
  isSeriesEntity,
  normalizeRtId,
  readEpisodeRtTarget,
  readRtTarget,
  readSeasonOrdinal,
};
export type {
  Claim,
  Entity,
  EntityMapping,
  EpisodeRtTarget,
  IdentityLookup,
  MappingEvidence,
  RottenMapping,
};
