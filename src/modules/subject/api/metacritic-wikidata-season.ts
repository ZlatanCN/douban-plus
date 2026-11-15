import {
  entityKind,
  readMetacriticId,
  readOrdinal,
  readQualifierOrdinal,
  uniqueReference,
} from "./metacritic-wikidata-claims";
import type {
  Entity,
  EntityKind,
  TargetResult,
} from "./metacritic-wikidata-claims";
import { fetchEntities, entityReference } from "./wikidata-client";

const seasonTarget = (
  entity: Entity,
  season: number,
  expectedSeriesId: string | null
): TargetResult => {
  if (entityKind(entity) !== "season") {
    return { status: "ambiguous" };
  }
  const ordinal = readOrdinal(entity.claims);
  const series = uniqueReference(entity.claims, "P179");
  const metacritic = readMetacriticId(entity);
  const idSeason =
    metacritic.status === "matched"
      ? Number(
          metacritic.metacriticId.match(/\/season-(?<season>\d+)$/u)?.groups
            ?.season
        )
      : null;
  if (
    ordinal.status === "ambiguous" ||
    (ordinal.status === "matched" && ordinal.value !== season) ||
    !Number.isSafeInteger(idSeason) ||
    idSeason !== season ||
    series.status !== "matched" ||
    (expectedSeriesId !== null && series.id !== expectedSeriesId) ||
    metacritic.status !== "matched"
  ) {
    return { status: "ambiguous" };
  }
  return {
    kind: "season",
    metacriticId: metacritic.metacriticId,
    season,
    seriesId: series.id,
    status: "matched",
  };
};

const seasonForEpisode = async (
  episode: Entity,
  season: number,
  signal: AbortSignal
): Promise<TargetResult> => {
  const seasonRef = uniqueReference(episode.claims, "P4908");
  if (seasonRef.status !== "matched") {
    return { status: seasonRef.status };
  }
  const expectedSeries = uniqueReference(episode.claims, "P179");
  if (expectedSeries.status === "ambiguous") {
    return expectedSeries;
  }
  const entities = await fetchEntities<Entity>([seasonRef.id], signal);
  const entity = entities[seasonRef.id];
  return entity
    ? seasonTarget(
        entity,
        season,
        expectedSeries.status === "matched" ? expectedSeries.id : null
      )
    : { status: "missing" };
};

const seasonForSeries = async (
  series: Entity,
  season: number,
  signal: AbortSignal
): Promise<TargetResult> => {
  const seriesMetacriticId = readMetacriticId(series);
  if (
    seriesMetacriticId.status !== "matched" ||
    !seriesMetacriticId.metacriticId.startsWith("tv/") ||
    seriesMetacriticId.metacriticId.includes("/season-")
  ) {
    return { status: "ambiguous" };
  }
  const seasonClaims = (series.claims?.P527 ?? [])
    .filter((claim) => claim.rank === "normal" || claim.rank === "preferred")
    .filter((claim) => claim.mainsnak?.snaktype === "value");
  const seasonCandidates = seasonClaims.map((claim) => ({
    id: entityReference(claim.mainsnak?.datavalue?.value),
    ordinal: readQualifierOrdinal(claim.qualifiers?.P1545),
  }));
  const seasonIds = seasonCandidates
    .filter(
      ({ ordinal }) => ordinal.status === "matched" && ordinal.value === season
    )
    .map(({ id }) => id)
    .filter((id): id is string => id !== null);
  const uniqueSeasonIds = [...new Set(seasonIds)];
  const [seasonId] = uniqueSeasonIds;
  if (uniqueSeasonIds.length !== 1 || !seasonId) {
    return { status: uniqueSeasonIds.length > 1 ? "ambiguous" : "missing" };
  }
  const entities = await fetchEntities<Entity>([seasonId], signal);
  const entity = entities[seasonId];
  return entity
    ? seasonTarget(entity, season, series.id)
    : { status: "missing" };
};

const resolveSeasonTarget = (
  entity: Entity,
  kind: EntityKind | null,
  season: number,
  signal: AbortSignal
): TargetResult | Promise<TargetResult> => {
  if (kind === "season") {
    return seasonTarget(entity, season, null);
  }
  if (kind === "episode") {
    return seasonForEpisode(entity, season, signal);
  }
  if (kind === "series" || kind === null) {
    return seasonForSeries(entity, season, signal);
  }
  return { status: "ambiguous" };
};

export { resolveSeasonTarget };
