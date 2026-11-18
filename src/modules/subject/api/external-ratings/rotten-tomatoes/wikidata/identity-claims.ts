import { entityReference } from "@/modules/subject/api/external-ratings/shared/wikidata-client";

type Claim = {
  mainsnak?: { datavalue?: { value?: unknown }; snaktype?: string };
  qualifiers?: Record<string, Claim[]>;
  rank?: string;
};

type Entity = { claims?: Record<string, Claim[]>; id: string };

const ACTIVE_RANKS = new Set(["normal", "preferred"]);
const SERIES_TYPES = new Set(["Q5398426", "Q1259759"]);

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

const isSeriesEntity = (entity: Entity): boolean =>
  claimValues(entity.claims?.P31)
    .map(entityReference)
    .some((id) => id !== null && SERIES_TYPES.has(id));

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
  ACTIVE_RANKS,
  SERIES_TYPES,
  activeIdentityClaims,
  claimValues,
  hasActiveIdentity,
  isDeprecatedIdentity,
  isSeriesEntity,
  readSeasonOrdinal,
};
export type { Claim, Entity };
