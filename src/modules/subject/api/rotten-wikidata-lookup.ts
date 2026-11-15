import { gmGetResponse } from "@/shared/utils/request";

import {
  activeIdentityClaims,
  claimValues,
  entityKind,
  entityReference,
  hasActiveIdentity,
  isDeprecatedIdentity,
  readEpisodeRtTarget,
  readRtTarget,
  readSeasonOrdinal,
} from "./rotten-wikidata-claims";
import type { Entity, IdentityLookup } from "./rotten-wikidata-claims";

const API_URL = "https://www.wikidata.org/w/api.php";
const REQUEST_TIMEOUT = 8000;
const EPISODE_TYPES = new Set(["Q21191270"]);

const fetchEntity = async (
  id: string,
  signal: AbortSignal
): Promise<Entity | null> => {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: id,
    origin: "*",
    props: "claims",
  }).toString();
  const response = await gmGetResponse(url.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const data = JSON.parse(response.responseText) as {
    entities?: Record<string, Entity>;
  };
  return data.entities?.[id] ?? null;
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

const mapEpisodeToSeries = async (
  episode: Entity,
  signal: AbortSignal,
  expectedSeason: number
): Promise<IdentityLookup> => {
  const types = claimValues(episode.claims?.P31)
    .map(entityReference)
    .filter((value): value is string => value !== null);
  if (!types.some((id) => EPISODE_TYPES.has(id))) {
    return { mappings: [], state: "missing" };
  }
  const episodeTarget = readEpisodeRtTarget(episode);
  if (
    episodeTarget.status === "ambiguous" ||
    (episodeTarget.status === "matched" &&
      episodeTarget.season !== expectedSeason)
  ) {
    return { mappings: [], state: "ambiguous" };
  }
  const seriesIds = [
    ...new Set(
      claimValues(episode.claims?.P179)
        .map(entityReference)
        .filter((value): value is string => value !== null)
    ),
  ];
  if (seriesIds.length !== 1) {
    return {
      mappings: [],
      state: seriesIds.length > 1 ? "ambiguous" : "missing",
    };
  }
  const [seriesId] = seriesIds;
  if (!seriesId) {
    return { mappings: [], state: "missing" };
  }

  const series = await fetchEntity(seriesId, signal);
  if (!series) {
    return { mappings: [], state: "missing" };
  }
  const target = readRtTarget(series);
  if (target.status !== "matched") {
    return { mappings: [], state: target.status };
  }
  if (entityKind(series, target.rtId) !== "series") {
    return { mappings: [], state: "missing" };
  }
  if (
    episodeTarget.status === "matched" &&
    episodeTarget.seriesRtId !== target.rtId
  ) {
    return { mappings: [], state: "ambiguous" };
  }
  return {
    mappings: [
      {
        entity: series,
        kind: "series",
        rtId: target.rtId,
        seasonOrdinal: null,
        seasonOrdinalConflict: false,
        seriesRtId: null,
      },
    ],
    state: "matched",
  };
};

const fetchEntities = async (
  property: "P345" | "P4529",
  value: string,
  signal: AbortSignal,
  expectedSeason?: number
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

  const claimsUrl = new URL(API_URL);
  claimsUrl.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: ids.join("|"),
    origin: "*",
    props: "claims",
  }).toString();
  const claimsResponse = await gmGetResponse(claimsUrl.href, undefined, {
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
  const [entity] = entities;
  if (!entity) {
    return { mappings: [], state: deprecated ? "deprecated" : "missing" };
  }
  const mapping = mapEntity(entity, property, value);
  // Episode IDs identify an episode page; validate the parent series for the requested season.
  if (
    property === "P345" &&
    expectedSeason !== undefined &&
    (mapping.state === "missing" || mapping.state === "ambiguous")
  ) {
    return mapEpisodeToSeries(entity, signal, expectedSeason);
  }
  return mapping;
};

export { fetchEntities };
