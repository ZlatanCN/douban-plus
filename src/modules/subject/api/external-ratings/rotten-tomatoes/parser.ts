import type { RtObjectKind } from "@/modules/subject/domain";

import {
  readStructuredPage,
  structuredPageTypes,
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
    canonical.search ||
    request.protocol !== "https:" ||
    request.hostname !== "www.rottentomatoes.com" ||
    request.search
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
    const url = new URL(urlValue);
    const match = url.pathname.match(/^\/tv\/(?<series>[^/]+)\/?$/u);
    if (url.hostname !== "www.rottentomatoes.com" || !match?.groups?.series) {
      return null;
    }
    return `tv/${match.groups.series}`;
  } catch {
    return null;
  }
};

const readSeasonNumber = (
  page: StructuredPage,
  html: string
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
  return Number.isSafeInteger(fromHeading) && fromHeading > 0
    ? fromHeading
    : null;
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
  const pageSeason = readSeasonNumber(page, html);
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
  for (const match of html.matchAll(/\bhref=["'](?<href>[^"']+)["']/giu)) {
    try {
      const link = new URL(
        match.groups?.href ?? "",
        "https://www.rottentomatoes.com"
      );
      const expected = `${prefix}${String(season).padStart(2, "0")}`;
      if (
        link.hostname === "www.rottentomatoes.com" &&
        link.pathname === expected
      ) {
        return link.pathname.slice(1);
      }
    } catch {
      // Ignore malformed links.
    }
  }
  return null;
};

export {
  findSeasonPath,
  readSeriesRtId,
  scorecardIdentityStatus,
  type ScorecardInput,
};
