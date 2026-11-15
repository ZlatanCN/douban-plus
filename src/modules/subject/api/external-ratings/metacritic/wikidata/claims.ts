import { entityReference } from "../../shared/wikidata-client";

type Snak = { datavalue?: { value?: unknown }; snaktype?: string };
type Claim = {
  mainsnak?: Snak;
  qualifiers?: Record<string, Snak[]>;
  rank?: string;
};

type Entity = { claims?: Record<string, Claim[]>; id: string };
type EntityKind = "episode" | "movie" | "season" | "series";
type TargetResult =
  | {
      kind: EntityKind;
      metacriticId: string;
      season: number | null;
      seriesId: string | null;
      status: "matched";
    }
  | { status: "ambiguous" | "missing" };
type MetacriticTarget = Extract<TargetResult, { status: "matched" }>;

const ACTIVE_RANKS = new Set(["normal", "preferred"]);
const TYPES = {
  episode: new Set(["Q21191270"]),
  movie: new Set(["Q11424"]),
  season: new Set(["Q3464665"]),
  series: new Set(["Q5398426", "Q15416"]),
} satisfies Record<EntityKind, Set<string>>;

const activeClaimValues = (claims: Claim[] | undefined): unknown[] =>
  (claims ?? [])
    .filter((claim) => ACTIVE_RANKS.has(claim.rank ?? ""))
    .filter((claim) => claim.mainsnak?.snaktype === "value")
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter((value) => value !== undefined);

const uniqueReference = (
  claims: Record<string, Claim[]> | undefined,
  property: string
): { id: string; status: "matched" } | { status: "ambiguous" | "missing" } => {
  const values = activeClaimValues(claims?.[property]);
  if (values.length === 0) {
    return { status: "missing" };
  }
  const ids = values.map(entityReference);
  if (ids.some((id) => id === null)) {
    return { status: "ambiguous" };
  }
  const uniqueIds = [...new Set(ids)];
  const [id] = uniqueIds;
  return uniqueIds.length === 1 && id
    ? { id, status: "matched" }
    : { status: "ambiguous" };
};

const ordinalResult = (
  rawValues: unknown[]
):
  | { status: "matched"; value: number }
  | { status: "ambiguous" | "missing" } => {
  const values = rawValues.map(Number);
  if (values.length === 0) {
    return { status: "missing" };
  }
  if (
    values.some((value) => !Number.isSafeInteger(value) || value <= 0) ||
    new Set(values).size !== 1
  ) {
    return { status: "ambiguous" };
  }
  return { status: "matched", value: values[0] ?? 0 };
};

const readOrdinal = (
  claims: Record<string, Claim[]> | undefined
): { status: "matched"; value: number } | { status: "ambiguous" | "missing" } =>
  ordinalResult(activeClaimValues(claims?.P1545));

const readQualifierOrdinal = (
  snaks: Snak[] | undefined
): { status: "matched"; value: number } | { status: "ambiguous" | "missing" } =>
  ordinalResult(
    (snaks ?? [])
      .filter((snak) => snak.snaktype === "value")
      .map((snak) => snak.datavalue?.value)
  );

const entityKind = (entity: Entity): EntityKind | null => {
  const types = activeClaimValues(entity.claims?.P31)
    .map(entityReference)
    .filter((id): id is string => id !== null);
  const matches = (Object.entries(TYPES) as [EntityKind, Set<string>][])
    .filter(([, ids]) => types.some((id) => ids.has(id)))
    .map(([kind]) => kind);
  return matches.length === 1 ? (matches[0] ?? null) : null;
};

const normalizeMetacriticId = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  let path = value.trim();
  if (/^https?:\/\//iu.test(path)) {
    try {
      const url = new URL(path);
      if (
        url.hostname !== "www.metacritic.com" &&
        url.hostname !== "metacritic.com"
      ) {
        return null;
      }
      path = url.pathname;
    } catch {
      return null;
    }
  }
  path = path.replaceAll(/^\/+|\/+$/gu, "");
  return /^(?:movie\/[^/]+|tv\/[^/]+(?:\/season-\d+)?)$/u.test(path)
    ? path
    : null;
};

const readMetacriticId = (
  entity: Entity
):
  | { metacriticId: string; status: "matched" }
  | { status: "ambiguous" | "missing" } => {
  const values = activeClaimValues(entity.claims?.P1712);
  if (values.length === 0) {
    return { status: "missing" };
  }
  const ids = values.map(normalizeMetacriticId);
  if (ids.some((id) => id === null)) {
    return { status: "ambiguous" };
  }
  const uniqueIds = [...new Set(ids)];
  const [metacriticId] = uniqueIds;
  return uniqueIds.length === 1 && metacriticId
    ? { metacriticId, status: "matched" }
    : { status: "ambiguous" };
};

const hasIdentity = (
  entity: Entity,
  property: "P345" | "P4529",
  value: string
): boolean =>
  (entity.claims?.[property] ?? []).some(
    (claim) =>
      ACTIVE_RANKS.has(claim.rank ?? "") &&
      claim.mainsnak?.snaktype === "value" &&
      String(claim.mainsnak.datavalue?.value) === value
  );

export {
  activeClaimValues,
  entityKind,
  hasIdentity,
  normalizeMetacriticId,
  readMetacriticId,
  readOrdinal,
  readQualifierOrdinal,
  uniqueReference,
  type Claim,
  type Entity,
  type EntityKind,
  type MetacriticTarget,
  type Snak,
  type TargetResult,
};
