import { entityReference, fetchEntities } from "./wikidata-client";

type TypeClaim = {
  mainsnak?: { datavalue?: { value?: unknown }; snaktype?: string };
  rank?: string;
};
type TypeEntity = { claims?: Record<string, TypeClaim[]> };

const FILM_TYPE_ID = "Q11424";
const MAX_TYPE_ANCESTRY_DEPTH = 4;
const MAX_TYPE_ANCESTRY_IDS = 32;
const typeParentCache = new Map<string, string[]>();
const typeParentRequests = new WeakMap<
  AbortSignal,
  Map<string, Promise<Record<string, string[]>>>
>();

const parentsOf = (entity: TypeEntity | undefined): string[] =>
  (entity?.claims?.P279 ?? [])
    .filter(
      (claim) =>
        claim.rank !== "deprecated" && claim.mainsnak?.snaktype === "value"
    )
    .map((claim) => entityReference(claim.mainsnak?.datavalue?.value))
    .filter((id): id is string => id !== null);

const fetchTypeParents = async (
  typeIds: string[],
  signal: AbortSignal
): Promise<Record<string, string[]>> => {
  const uncached = typeIds.filter((id) => !typeParentCache.has(id));
  if (uncached.length > 0) {
    let requests = typeParentRequests.get(signal);
    if (!requests) {
      requests = new Map();
      typeParentRequests.set(signal, requests);
    }
    const key = uncached.toSorted().join("|");
    let request = requests.get(key);
    if (!request) {
      request = fetchEntities<TypeEntity>(uncached, signal).then((entities) => {
        const parentsById: Record<string, string[]> = {};
        for (const id of uncached) {
          const parents = parentsOf(entities[id]);
          typeParentCache.set(id, parents);
          parentsById[id] = parents;
        }
        return parentsById;
      });
      requests.set(key, request);
      void request.catch(() => {
        if (requests?.get(key) === request) {
          requests.delete(key);
        }
      });
    }
    await request;
  }
  return Object.fromEntries(
    typeIds.map((id) => [id, typeParentCache.get(id) ?? []])
  );
};

const isFilmInstance = (
  instanceTypeIds: string[],
  signal: AbortSignal
): Promise<boolean> => {
  const frontier = [...new Set(instanceTypeIds)].slice(
    0,
    MAX_TYPE_ANCESTRY_IDS
  );
  const visited = new Set(frontier);
  const hasFilmAncestor = async (
    currentFrontier: string[],
    depth: number
  ): Promise<boolean> => {
    if (currentFrontier.length === 0 || depth >= MAX_TYPE_ANCESTRY_DEPTH) {
      return false;
    }
    if (currentFrontier.includes(FILM_TYPE_ID)) {
      return true;
    }
    const parents = new Set<string>();
    const parentMap = await fetchTypeParents(currentFrontier, signal);
    for (const id of currentFrontier) {
      for (const parent of parentMap[id] ?? []) {
        if (parent === FILM_TYPE_ID) {
          return true;
        }
        if (!visited.has(parent) && visited.size < MAX_TYPE_ANCESTRY_IDS) {
          visited.add(parent);
          parents.add(parent);
        }
      }
    }
    return hasFilmAncestor([...parents], depth + 1);
  };
  return hasFilmAncestor(frontier, 0);
};

type RottenTomatoesPath =
  | { kind: "movie" }
  | { kind: "series"; series: string }
  | { kind: "season"; season: number; series: string };

const parseRottenTomatoesPath = (value: string): RottenTomatoesPath | null => {
  if (/^m\/[^/]+$/u.test(value)) {
    return { kind: "movie" };
  }
  const match = value.match(/^tv\/(?<series>[^/]+)(?:\/s(?<season>\d{2,}))?$/u);
  const series = match?.groups?.series;
  if (!series) {
    return null;
  }
  const rawSeason = match.groups?.season;
  if (rawSeason === undefined) {
    return { kind: "series", series };
  }
  const season = Number(rawSeason);
  return Number.isSafeInteger(season) && season > 0
    ? { kind: "season", season, series }
    : null;
};

export { isFilmInstance, parseRottenTomatoesPath };
