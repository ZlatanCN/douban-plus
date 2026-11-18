import {
  entityReference,
  fetchEntities,
} from "@/modules/subject/api/external-ratings/shared/wikidata-client";

import {
  readMetacriticId,
  readQualifierOrdinal,
  uniqueReference,
} from "./claims";
import type { Entity, EntityKind, TargetResult } from "./claims";
import {
  metacriticSeriesTarget,
  needsSeasonLink,
  seasonTarget,
  seriesAndSeason,
} from "./season-target";

const seasonForEpisode = async (
  episode: Entity,
  season: number,
  signal: AbortSignal
): Promise<TargetResult> => {
  const seasonRef = uniqueReference(episode.claims, "P4908");
  if (seasonRef.status === "ambiguous") {
    return seasonRef;
  }
  if (seasonRef.status === "missing") {
    const series = uniqueReference(episode.claims, "P179");
    if (series.status !== "matched") {
      return series;
    }
    const resolvedSeries = await seriesAndSeason(series.id, signal);
    if (resolvedSeries.status !== "matched") {
      return resolvedSeries;
    }
    return needsSeasonLink(resolvedSeries.target, season);
  }
  const entities = await fetchEntities<Entity>([seasonRef.id], signal);
  const entity = entities[seasonRef.id];
  if (!entity) {
    const series = uniqueReference(episode.claims, "P179");
    if (series.status !== "matched") {
      return series;
    }
    const resolvedSeries = await seriesAndSeason(series.id, signal);
    return resolvedSeries.status === "matched"
      ? needsSeasonLink(resolvedSeries.target, season)
      : resolvedSeries;
  }
  const result = await seasonForSeason(entity, season, signal);
  if (result.status !== "missing") {
    return result;
  }
  const series = uniqueReference(episode.claims, "P179");
  if (series.status !== "matched") {
    return result;
  }
  const resolvedSeries = await seriesAndSeason(series.id, signal);
  return resolvedSeries.status === "matched"
    ? needsSeasonLink(resolvedSeries.target, season)
    : resolvedSeries;
};

const seasonForSeries = async (
  series: Entity,
  season: number,
  signal: AbortSignal
): Promise<TargetResult> => {
  const mappedSeries = readMetacriticId(series);
  if (mappedSeries.status === "ambiguous") {
    return mappedSeries;
  }
  const seriesTarget =
    mappedSeries.status === "matched" ? metacriticSeriesTarget(series) : null;
  if (seriesTarget && seriesTarget.status !== "matched") {
    return seriesTarget;
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
  if (uniqueSeasonIds.length > 1) {
    return { status: "ambiguous" };
  }
  if (!seasonId) {
    return seriesTarget
      ? needsSeasonLink(seriesTarget, season)
      : { status: "missing" };
  }
  const entities = await fetchEntities<Entity>([seasonId], signal);
  const entity = entities[seasonId];
  if (!entity) {
    return seriesTarget
      ? needsSeasonLink(seriesTarget, season)
      : { status: "missing" };
  }
  const seasonMetacriticId = readMetacriticId(entity);
  const fallbackSeriesId =
    seasonMetacriticId.status === "matched"
      ? seasonMetacriticId.metacriticId.replace(/\/season-\d+$/u, "")
      : undefined;
  const confirmedSeriesTarget =
    seriesTarget ??
    (fallbackSeriesId
      ? metacriticSeriesTarget(series, fallbackSeriesId)
      : null);
  if (!confirmedSeriesTarget) {
    return { status: "missing" };
  }
  if (confirmedSeriesTarget.status !== "matched") {
    return confirmedSeriesTarget;
  }
  const result = await seasonTarget(
    entity,
    season,
    series.id,
    confirmedSeriesTarget.metacriticId,
    confirmedSeriesTarget.identityReferences,
    signal
  );
  return result.status === "missing"
    ? needsSeasonLink(confirmedSeriesTarget, season)
    : result;
};

const seasonForSeason = async (
  entity: Entity,
  season: number,
  signal: AbortSignal
): Promise<TargetResult> => {
  const series = uniqueReference(entity.claims, "P179");
  if (series.status !== "matched") {
    return series;
  }
  const seasonMetacriticId = readMetacriticId(entity);
  const fallbackSeriesId =
    seasonMetacriticId.status === "matched"
      ? seasonMetacriticId.metacriticId.replace(/\/season-\d+$/u, "")
      : undefined;
  const resolvedSeries = await seriesAndSeason(
    series.id,
    signal,
    fallbackSeriesId
  );
  if (resolvedSeries.status !== "matched") {
    return resolvedSeries;
  }
  return seasonTarget(
    entity,
    season,
    resolvedSeries.series.id,
    resolvedSeries.target.metacriticId,
    resolvedSeries.target.identityReferences,
    signal
  );
};

const resolveSeasonTarget = (
  entity: Entity,
  kind: EntityKind | null,
  season: number,
  signal: AbortSignal
): TargetResult | Promise<TargetResult> => {
  if (kind === "season") {
    return seasonForSeason(entity, season, signal);
  }
  if (kind === "episode") {
    return seasonForEpisode(entity, season, signal);
  }
  if (kind === "series") {
    return seasonForSeries(entity, season, signal);
  }
  return { status: "ambiguous" };
};

export { resolveSeasonTarget };
