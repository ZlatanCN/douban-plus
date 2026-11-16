import {
  entityReference,
  fetchEntities as fetchWikidataEntities,
  findEntityCandidates,
} from "@/modules/subject/api/external-ratings/shared/wikidata-client";
import { parseRottenTomatoesPath } from "@/modules/subject/api/external-ratings/shared/wikidata-identity";

import {
  activeIdentityClaims,
  claimValues,
  entityKind,
  hasActiveIdentity,
  isDeprecatedIdentity,
  readEpisodeRtTarget,
  readRtTarget,
  readSeasonOrdinal,
} from "./claims";
import type { Entity, IdentityLookup } from "./claims";

const EPISODE_TYPES = new Set(["Q21191270"]);

const fetchEntity = async (
  id: string,
  signal: AbortSignal
): Promise<Entity | null> => {
  const entities = await fetchWikidataEntities<Entity>([id], signal);
  return entities[id] ?? null;
};

const mapEntity = async (
  entity: Entity,
  property: "P345" | "P4529",
  identifier: string,
  signal: AbortSignal
): Promise<IdentityLookup> => {
  const identityClaims = activeIdentityClaims(entity, property, identifier);
  const target = readRtTarget(entity);
  if (target.status !== "matched") {
    return { mappings: [], state: target.status };
  }
  const kind = await entityKind(entity, target.rtId, signal);
  if (!kind) {
    return { mappings: [], state: "missing" };
  }
  const seasonOrdinal = readSeasonOrdinal(identityClaims, property);
  const parsedPath = parseRottenTomatoesPath(target.rtId);
  const seriesSlug = parsedPath?.kind === "season" ? parsedPath.series : null;
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
  if ((await entityKind(series, target.rtId, signal)) !== "series") {
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
  const candidates = await findEntityCandidates<Entity>(
    property,
    value,
    signal
  );
  if (candidates.status !== "matched") {
    return { mappings: [], state: candidates.status };
  }
  const entities = candidates.entities.filter((entity) =>
    hasActiveIdentity(entity, property, value)
  );
  const deprecated = candidates.entities.some((entity) =>
    isDeprecatedIdentity(entity, property, value)
  );
  if (entities.length > 1) {
    return { mappings: [], state: "ambiguous" };
  }
  const [entity] = entities;
  if (!entity) {
    return { mappings: [], state: deprecated ? "deprecated" : "missing" };
  }
  const mapping = await mapEntity(entity, property, value, signal);
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
