import type { ResolutionContext } from "@/modules/subject/resolve/types";

import type { EntityMapping, IdentityLookup, RottenMapping } from "./claims";

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

export { combineLookups };
