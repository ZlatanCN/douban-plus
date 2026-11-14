import type { ResolutionContext } from "@/modules/subject/resolve/types";
import { gmGetResponse } from "@/shared/utils/request";

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
      needsSeasonLink: boolean;
      rtId: string;
      seriesRtId: string | null;
      status: "matched";
    };

const API_URL = "https://www.wikidata.org/w/api.php";
const REQUEST_TIMEOUT = 8000;
const ACTIVE_RANKS = new Set(["normal", "preferred"]);
const FILM_TYPES = new Set(["Q11424"]);
const SERIES_TYPES = new Set(["Q5398426"]);
const SEASON_TYPES = new Set(["Q3464665"]);

const entityReference = (value: unknown): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = Reflect.get(value, "id");
  return typeof id === "string" ? id : null;
};

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
    return /^(?:m\/[^/]+|tv\/[^/]+(?:\/s\d{2,})?)$/u.test(path) ? path : null;
  } catch {
    return null;
  }
};

const entityKind = (
  entity: Entity,
  rtId: string
): EntityMapping["kind"] | null => {
  const types = claimValues(entity.claims?.P31)
    .map(entityReference)
    .filter((value): value is string => value !== null);
  if (rtId.startsWith("m/") && types.some((id) => FILM_TYPES.has(id))) {
    return "movie";
  }
  if (rtId.includes("/s") && types.some((id) => SEASON_TYPES.has(id))) {
    return "season";
  }
  if (
    rtId.startsWith("tv/") &&
    !rtId.includes("/s") &&
    types.some((id) => SERIES_TYPES.has(id))
  ) {
    return "series";
  }
  return null;
};

type RtTarget =
  | { rtId: string; status: "matched" }
  | { status: "ambiguous" | "deprecated" | "missing" };

const readRtTarget = (entity: Entity): RtTarget => {
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

const mapEntity = (
  entity: Entity,
  property: "P345" | "P4529",
  identifier: string
): IdentityLookup => {
  const identityClaims = activeIdentityClaims(entity, property, identifier);
  const target = readRtTarget(entity);
  if (target.status !== "matched") {
    return { mappings: [], state: target.status };
  }
  const kind = entityKind(entity, target.rtId);
  if (!kind) {
    return { mappings: [], state: "missing" };
  }
  const seasonOrdinal = readSeasonOrdinal(identityClaims, property);
  const seriesSlug = target.rtId.match(/^tv\/(?<series>[^/]+)\/s\d{2,}$/u)
    ?.groups?.series;
  return {
    mappings: [
      {
        entity,
        kind,
        rtId: target.rtId,
        seasonOrdinal: seasonOrdinal.value,
        seasonOrdinalConflict: seasonOrdinal.conflict,
        seriesRtId: seriesSlug ? `tv/${seriesSlug}` : null,
      },
    ],
    state: "matched",
  };
};

const fetchEntities = async (
  property: "P345" | "P4529",
  value: string,
  signal: AbortSignal
): Promise<IdentityLookup> => {
  const searchUrl = new URL(API_URL);
  searchUrl.search = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    origin: "*",
    srlimit: "50",
    srnamespace: "0",
    srsearch: `haswbstatement:${property}=${value}`,
  }).toString();
  const searchResponse = await gmGetResponse(searchUrl.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const search = JSON.parse(searchResponse.responseText) as {
    continue?: Record<string, string>;
    query?: { search?: { title?: string }[] };
  };
  if (search.continue) {
    return { mappings: [], state: "ambiguous" };
  }
  const ids = [
    ...new Set(
      (search.query?.search ?? [])
        .map((result) => result.title)
        .filter((id): id is string => /^Q\d+$/u.test(id ?? ""))
    ),
  ];
  if (ids.length === 0) {
    return { mappings: [], state: "missing" };
  }

  const entityUrl = new URL(API_URL);
  entityUrl.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: ids.join("|"),
    origin: "*",
    props: "claims",
  }).toString();
  const claimsResponse = await gmGetResponse(entityUrl.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const entityResponse = JSON.parse(claimsResponse.responseText) as {
    entities?: Record<string, Entity>;
  };
  const entities = Object.values(entityResponse.entities ?? {}).filter(
    (entity) => hasActiveIdentity(entity, property, value)
  );
  const deprecated = Object.values(entityResponse.entities ?? {}).some(
    (entity) => isDeprecatedIdentity(entity, property, value)
  );
  if (entities.length > 1) {
    return { mappings: [], state: "ambiguous" };
  }
  if (entities.length === 0) {
    return { mappings: [], state: deprecated ? "deprecated" : "missing" };
  }
  const [entity] = entities;
  if (!entity) {
    return { mappings: [], state: "missing" };
  }
  return mapEntity(entity, property, value);
};

const seasonPath = (rtId: string, season: number): string | null => {
  const match = rtId.match(/^tv\/(?<series>[^/]+)\/s(?<season>\d{2,})$/u);
  return match?.groups?.season === String(season).padStart(2, "0")
    ? rtId
    : null;
};

const unavailable = (
  reason: Extract<RottenMapping, { status: "unavailable" }>["reason"]
): RottenMapping => ({ reason, status: "unavailable" });

const uniqueRtTarget = (mappings: EntityMapping[]): string | null => {
  const targets = new Set(mappings.map(({ rtId }) => rtId));
  if (targets.size !== 1) {
    return null;
  }
  const [mapping] = mappings;
  return mapping?.rtId ?? null;
};

const unavailableLookup = (
  imdb: IdentityLookup | null,
  douban: IdentityLookup | null
): RottenMapping => {
  const states = new Set([imdb?.state, douban?.state]);
  if (states.has("ambiguous")) {
    return unavailable("ambiguous");
  }
  if (states.has("deprecated")) {
    return unavailable("deprecated");
  }
  if (states.has("error")) {
    return unavailable("error");
  }
  return unavailable("missing");
};

const matchMovie = (mappings: EntityMapping[]): RottenMapping => {
  if (mappings.some(({ kind }) => kind !== "movie")) {
    return unavailable("conflict");
  }
  const rtId = uniqueRtTarget(mappings);
  if (!rtId) {
    return unavailable("conflict");
  }
  return { needsSeasonLink: false, rtId, seriesRtId: null, status: "matched" };
};

const matchSeason = (
  seasons: EntityMapping[],
  series: EntityMapping[],
  season: number
): RottenMapping => {
  const targets = seasons.map(({ rtId }) => seasonPath(rtId, season));
  if (targets.some((target) => target === null)) {
    return unavailable("season");
  }
  if (
    seasons.some(
      ({ seasonOrdinal, seasonOrdinalConflict }) =>
        seasonOrdinalConflict ||
        (seasonOrdinal !== null && seasonOrdinal !== season)
    )
  ) {
    return unavailable("season");
  }
  const uniqueTargets = [...new Set(targets)];
  if (uniqueTargets.length > 1) {
    return unavailable("conflict");
  }
  const [seasonTarget] = uniqueTargets;
  if (seasonTarget) {
    const seasonSeries = new Set(seasons.map(({ seriesRtId }) => seriesRtId));
    const [seriesRtId] = seasonSeries;
    const matchesParent = Boolean(
      seriesRtId &&
      seasonSeries.size === 1 &&
      series.every(({ rtId }) => rtId === seriesRtId)
    );
    if (!matchesParent || !seriesRtId) {
      return unavailable("conflict");
    }
    return {
      needsSeasonLink: false,
      rtId: seasonTarget,
      seriesRtId,
      status: "matched",
    };
  }
  const seriesTarget = uniqueRtTarget(series);
  if (seriesTarget) {
    return {
      needsSeasonLink: true,
      rtId: seriesTarget,
      seriesRtId: seriesTarget,
      status: "matched",
    };
  }
  return unavailable("season");
};

const matchSeries = (
  seasons: EntityMapping[],
  series: EntityMapping[]
): RottenMapping => {
  if (seasons.length > 0) {
    return unavailable("season");
  }
  const rtId = uniqueRtTarget(series);
  if (!rtId) {
    return unavailable(series.length > 0 ? "conflict" : "missing");
  }
  return { needsSeasonLink: false, rtId, seriesRtId: null, status: "matched" };
};

const combineLookups = (
  imdb: IdentityLookup | null,
  douban: IdentityLookup | null,
  context: ResolutionContext
): RottenMapping => {
  if ([imdb?.state, douban?.state].includes("ambiguous")) {
    return unavailable("ambiguous");
  }
  const mappings = [...(imdb?.mappings ?? []), ...(douban?.mappings ?? [])];
  if (mappings.length === 0) {
    return unavailableLookup(imdb, douban);
  }
  const hasMovie = mappings.some(({ kind }) => kind === "movie");
  if ((context.kind === "movie") !== hasMovie) {
    return unavailable("conflict");
  }
  if (context.kind === "movie") {
    return matchMovie(mappings);
  }
  const seasons = mappings.filter(({ kind }) => kind === "season");
  const series = mappings.filter(({ kind }) => kind === "series");
  if (context.seasonConflict || context.unsupportedEpisode) {
    return unavailable("season");
  }
  if (context.season === null) {
    return matchSeries(seasons, series);
  }
  return matchSeason(seasons, series, context.season);
};

const fromSettledLookup = (
  result: PromiseSettledResult<IdentityLookup | null>
): IdentityLookup | null =>
  result.status === "fulfilled"
    ? result.value
    : { mappings: [], state: "error" };

const resolveRottenMapping = async (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<RottenMapping> => {
  if (!context.subjectId) {
    return unavailable("missing");
  }
  if (context.seasonConflict || context.unsupportedEpisode) {
    return unavailable("season");
  }
  const lookups = await Promise.allSettled([
    context.imdbId ? fetchEntities("P345", context.imdbId, signal) : null,
    fetchEntities("P4529", context.subjectId, signal),
  ]);
  const [imdbResult, doubanResult] = lookups;
  const imdb = fromSettledLookup(imdbResult);
  const douban = fromSettledLookup(doubanResult) ?? {
    mappings: [],
    state: "error",
  };
  return combineLookups(imdb, douban, context);
};

export { resolveRottenMapping };
export type { RottenMapping };
