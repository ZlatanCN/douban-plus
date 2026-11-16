import { entityReference } from "@/modules/subject/api/external-ratings/shared/wikidata-client";
import {
  isFilmInstance,
  parseRottenTomatoesPath,
} from "@/modules/subject/api/external-ratings/shared/wikidata-identity";

type Claim = {
  mainsnak?: { datavalue?: { value?: unknown }; snaktype?: string };
  qualifiers?: Record<string, Claim[]>;
  rank?: string;
};

type Entity = { claims?: Record<string, Claim[]>; id: string };

type EntityMapping = {
  entity: Entity;
  kind: "movie" | "season" | "series";
  rtId: string;
  seriesRtId: string | null;
  seasonOrdinal: number | null;
  seasonOrdinalConflict: boolean;
};

type IdentityLookup =
  | {
      mappings: EntityMapping[];
      state: "ambiguous" | "deprecated" | "error" | "missing";
    }
  | { mappings: EntityMapping[]; state: "matched" };

type RottenMapping =
  | {
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
    };

type EpisodeRtTarget =
  | { rtId: string; season: number; seriesRtId: string; status: "matched" }
  | { status: "ambiguous" | "missing" };

const ACTIVE_RANKS = new Set(["normal", "preferred"]);
const SERIES_TYPES = new Set(["Q5398426", "Q1259759"]);
const SEASON_TYPES = new Set(["Q3464665"]);

const claimValues = (claims: Claim[] | undefined): unknown[] =>
  (claims ?? [])
    .filter((claim) => claim.rank !== "deprecated")
    .filter((claim) => claim.mainsnak?.snaktype === "value")
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter((value) => value !== undefined);

const activeIdentityClaims = (
  entity: Entity,
  property: "P345" | "P4529",
  value: string
): Claim[] =>
  (entity.claims?.[property] ?? []).filter((claim) => {
    const claimValue = claim.mainsnak?.datavalue?.value;
    return (
      ACTIVE_RANKS.has(claim.rank ?? "") &&
      claim.mainsnak?.snaktype === "value" &&
      String(claimValue) === value
    );
  });

const hasActiveIdentity = (
  entity: Entity,
  property: "P345" | "P4529",
  value: string
): boolean => activeIdentityClaims(entity, property, value).length > 0;

const isDeprecatedIdentity = (
  entity: Entity,
  property: "P345" | "P4529",
  value: string
): boolean =>
  (entity.claims?.[property] ?? []).some(
    (claim) =>
      claim.rank === "deprecated" &&
      claim.mainsnak?.snaktype === "value" &&
      String(claim.mainsnak.datavalue?.value) === value
  );

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

const readSeasonOrdinal = (
  claims: Claim[],
  property: "P345" | "P4529"
): { conflict: boolean; value: number | null } => {
  const qualifiers =
    property === "P4529"
      ? claims.flatMap((claim) => claim.qualifiers?.P1545 ?? [])
      : [];
  const values = qualifiers
    .filter(
      (claim) =>
        claim.rank !== "deprecated" && claim.mainsnak?.snaktype === "value"
    )
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .map((qualifierValue) => {
      const ordinal =
        typeof qualifierValue === "number"
          ? qualifierValue
          : Number(qualifierValue);
      return Number.isSafeInteger(ordinal) && ordinal > 0 ? ordinal : null;
    });
  const ordinals = values.filter(
    (ordinal): ordinal is number => ordinal !== null
  );
  const uniqueOrdinals = new Set(ordinals);
  const [value] = uniqueOrdinals;
  return {
    conflict: ordinals.length !== qualifiers.length || uniqueOrdinals.size > 1,
    value: value ?? null,
  };
};

export {
  activeIdentityClaims,
  claimValues,
  entityKind,
  hasActiveIdentity,
  isDeprecatedIdentity,
  normalizeRtId,
  readEpisodeRtTarget,
  readRtTarget,
  readSeasonOrdinal,
  type Claim,
  type Entity,
  type EntityMapping,
  type EpisodeRtTarget,
  type IdentityLookup,
  type RottenMapping,
};
