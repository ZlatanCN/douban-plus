import { fetchEntities } from "@/modules/subject/api/external-ratings/shared/wikidata-client";

import {
  entityKind,
  identityReferences,
  readMetacriticId,
  readOrdinal,
  uniqueReference,
} from "./claims";
import type { Entity, MetacriticTarget, TargetResult } from "./claims";

const metacriticSeriesTarget = (
  entity: Entity,
  fallbackMetacriticId?: string
): MetacriticTarget | { status: "ambiguous" | "missing" } => {
  const metacritic = readMetacriticId(entity);
  if (metacritic.status === "ambiguous") {
    return { status: "ambiguous" };
  }
  const metacriticId =
    metacritic.status === "matched"
      ? metacritic.metacriticId
      : fallbackMetacriticId;
  if (!metacriticId) {
    return { status: "missing" };
  }
  if (!metacriticId.startsWith("tv/") || metacriticId.includes("/season-")) {
    return { status: "ambiguous" };
  }
  return {
    kind: "series",
    identityReferences: identityReferences(entity),
    metacriticId,
    season: null,
    seriesId: entity.id,
    seriesMetacriticId: metacriticId,
    status: "matched",
  };
};

const needsSeasonLink = (
  seriesTarget: MetacriticTarget,
  season: number
): TargetResult => ({ season, seriesTarget, status: "season-link-needed" });

const seasonTarget = async (
  entity: Entity,
  season: number,
  expectedSeriesId: string,
  seriesMetacriticId: string,
  seriesIdentityReferences: MetacriticTarget["identityReferences"],
  signal: AbortSignal
): Promise<TargetResult> => {
  const kind = await entityKind(entity, signal);
  if (kind === "episode") {
    return { status: "missing" };
  }
  if (kind !== "season") {
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
  const idSeries =
    metacritic.status === "matched"
      ? metacritic.metacriticId.replace(/\/season-\d+$/u, "")
      : null;
  if (
    ordinal.status === "ambiguous" ||
    (ordinal.status === "matched" && ordinal.value !== season) ||
    (series.status === "matched" && series.id !== expectedSeriesId) ||
    series.status === "ambiguous" ||
    (metacritic.status === "matched" &&
      (!Number.isSafeInteger(idSeason) ||
        idSeason !== season ||
        idSeries !== seriesMetacriticId)) ||
    metacritic.status === "ambiguous"
  ) {
    return { status: "ambiguous" };
  }
  if (series.status === "missing" || metacritic.status === "missing") {
    return { status: "missing" };
  }
  return {
    kind: "season",
    identityReferences: seriesIdentityReferences,
    metacriticId: metacritic.metacriticId,
    season,
    seriesId: expectedSeriesId,
    seriesMetacriticId,
    status: "matched",
  };
};

const seriesAndSeason = async (
  seriesId: string,
  signal: AbortSignal,
  fallbackMetacriticId?: string
): Promise<
  | { series: Entity; target: MetacriticTarget; status: "matched" }
  | { status: "ambiguous" }
  | { status: "missing" }
> => {
  const fetched = await fetchEntities<Entity>([seriesId], signal);
  const series = fetched[seriesId];
  if (!series) {
    return { status: "missing" };
  }
  if ((await entityKind(series, signal)) !== "series") {
    return { status: "ambiguous" };
  }
  const result = metacriticSeriesTarget(series, fallbackMetacriticId);
  if (result.status === "matched") {
    return { series, target: result, status: "matched" };
  }
  return result.status === "ambiguous"
    ? { status: "ambiguous" }
    : { status: "missing" };
};

export {
  metacriticSeriesTarget,
  needsSeasonLink,
  seasonTarget,
  seriesAndSeason,
};
