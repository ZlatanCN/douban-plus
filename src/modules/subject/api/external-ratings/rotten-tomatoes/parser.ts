import type { RtObjectKind } from "@/modules/subject/domain";

import {
  readStructuredPage,
  structuredPageTypes,
  structuredTypes,
} from "../shared/structured-page";
import type { StructuredPage } from "../shared/structured-page";

type ScorecardInput = {
  fetchedAt: number;
  kind: RtObjectKind;
  pageRtId: string;
  rtId: string;
  season: number | null;
  seriesRtId: string | null;
  subjectId: string;
  url: string;
};

const normalizedPath = (pathname: string): string =>
  pathname.replaceAll(/\/+$/gu, "") || "/";

const seasonPathFromUrl = (value: unknown, expected: string): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  try {
    const link = new URL(value, "https://www.rottentomatoes.com");
    if (
      link.protocol === "https:" &&
      link.hostname === "www.rottentomatoes.com" &&
      !link.username &&
      !link.password &&
      !link.search &&
      !link.hash &&
      link.pathname === expected
    ) {
      return link.pathname.slice(1);
    }
  } catch {
    // Ignore malformed source season links.
  }
  return null;
};

const matchesRtPageIdentity = (
  canonicalUrl: string,
  pageUrl: string,
  pageRtId: string
): boolean => {
  let canonical: URL;
  let request: URL;
  try {
    canonical = new URL(canonicalUrl, pageUrl);
    request = new URL(pageUrl);
  } catch {
    return false;
  }
  if (
    canonical.protocol !== "https:" ||
    canonical.hostname !== "www.rottentomatoes.com" ||
    canonical.username ||
    canonical.password ||
    canonical.search ||
    canonical.hash ||
    request.protocol !== "https:" ||
    request.hostname !== "www.rottentomatoes.com" ||
    request.username ||
    request.password ||
    request.search ||
    request.hash
  ) {
    return false;
  }
  const expectedPath = normalizedPath(`/${pageRtId}`);
  return (
    normalizedPath(canonical.pathname) === expectedPath &&
    normalizedPath(request.pathname) === expectedPath
  );
};

const readSeriesRtId = (page: StructuredPage): string | null => {
  const season = page.jsonLd.find((entry) => {
    const type = entry["@type"];
    return (
      type === "TVSeason" || (Array.isArray(type) && type.includes("TVSeason"))
    );
  });
  const partOfSeries = season?.partOfSeries;
  if (!partOfSeries || typeof partOfSeries !== "object") {
    return null;
  }
  const urlValue = Reflect.get(partOfSeries, "url");
  if (typeof urlValue !== "string") {
    return null;
  }
  try {
    const url = new URL(urlValue, "https://www.rottentomatoes.com");
    const match = url.pathname.match(/^\/tv\/(?<series>[^/]+)\/?$/u);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.rottentomatoes.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !match?.groups?.series
    ) {
      return null;
    }
    return `tv/${match.groups.series}`;
  } catch {
    return null;
  }
};

const readSeasonNumber = (
  page: StructuredPage,
  html: string,
  pageRtId: string
): number | null => {
  const value = page.jsonLd.find(
    (entry) => entry.seasonNumber !== undefined
  )?.seasonNumber;
  const fromStructuredData = Number(value);
  if (Number.isSafeInteger(fromStructuredData) && fromStructuredData > 0) {
    return fromStructuredData;
  }
  const heading = html.match(
    /<h1\b[^>]*>[\s\S]*?season\s+(?<season>\d+)[\s\S]*?<\/h1>/iu
  )?.groups?.season;
  const fromHeading = Number(heading);
  if (Number.isSafeInteger(fromHeading) && fromHeading > 0) {
    return fromHeading;
  }
  const path = pageRtId.match(/^tv\/[^/]+\/s(?<season>\d{2,})$/u);
  const fromPath = Number(path?.groups?.season);
  return Number.isSafeInteger(fromPath) && fromPath > 0 ? fromPath : null;
};

const scorecardIdentityStatus = (
  page: StructuredPage,
  html: string,
  input: ScorecardInput
): "matched" | "identity-conflict" | "invalid-page" => {
  if (!page.canonicalUrl) {
    return "invalid-page";
  }
  if (!matchesRtPageIdentity(page.canonicalUrl, input.url, input.pageRtId)) {
    return "identity-conflict";
  }
  const types = structuredPageTypes(page);
  if (types.size === 0) {
    return "invalid-page";
  }
  if (input.kind === "movie") {
    return types.has("Movie") ? "matched" : "identity-conflict";
  }
  if (input.kind === "series") {
    return types.has("TVSeries") ? "matched" : "identity-conflict";
  }
  if (!types.has("TVSeason")) {
    return "identity-conflict";
  }
  const pageSeason = readSeasonNumber(page, html, input.pageRtId);
  const pageSeries = readSeriesRtId(page);
  if (
    pageSeason === null ||
    pageSeries === null ||
    input.season === null ||
    input.seriesRtId === null
  ) {
    return "invalid-page";
  }
  return pageSeason === input.season && pageSeries === input.seriesRtId
    ? "matched"
    : "identity-conflict";
};

const findSeasonPath = (
  html: string,
  seriesRtId: string,
  season: number
): string | null => {
  const page = readStructuredPage(html);
  if (!structuredPageTypes(page).has("TVSeries")) {
    return null;
  }
  const prefix = `/${seriesRtId}/s`;
  const expected = `${prefix}${String(season).padStart(2, "0")}`;
  const series = page.jsonLd.find((entry) =>
    structuredTypes(entry).includes("TVSeries")
  );
  const seasons = series?.containsSeason;
  let linkedSeasons: unknown[];
  if (Array.isArray(seasons)) {
    linkedSeasons = seasons;
  } else if (seasons && typeof seasons === "object") {
    linkedSeasons = [seasons];
  } else {
    linkedSeasons = [];
  }
  for (const linkedSeason of linkedSeasons) {
    if (!linkedSeason || typeof linkedSeason !== "object") {
      continue;
    }
    const path = seasonPathFromUrl(Reflect.get(linkedSeason, "url"), expected);
    if (path) {
      return path;
    }
  }
  const sourcePage = new DOMParser().parseFromString(html, "text/html");
  for (const seasonLink of sourcePage.querySelectorAll("tile-season[href]")) {
    const path = seasonPathFromUrl(seasonLink.getAttribute("href"), expected);
    if (path) {
      return path;
    }
  }
  return null;
};

export {
  findSeasonPath,
  readSeriesRtId,
  readSeasonNumber,
  scorecardIdentityStatus,
  type ScorecardInput,
};
