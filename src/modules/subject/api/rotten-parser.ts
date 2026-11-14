import type { RtCount, RtObjectKind, RtRating } from "@/modules/subject/domain";

type RatingSide = {
  bandedRatingCount?: unknown;
  ratingCount?: unknown;
  scorePercent?: unknown;
};
type AudienceOverlay = {
  audienceAll?: RatingSide | null;
  audienceVerified?: RatingSide | null;
  hasAudienceAll?: boolean;
  hasAudienceVerified?: boolean;
};
type Scorecard = {
  audienceScore?: (RatingSide & Record<string, unknown>) | null;
  hideAudienceScore?: boolean;
  overlay?: AudienceOverlay;
  criticsScore?: RatingSide | null;
};

type PageIdentity = {
  canonicalUrl: string | null;
  jsonLd: Record<string, unknown>[];
};

type ScorecardInput = {
  fetchedAt: number;
  kind: RtObjectKind;
  rtId: string;
  season: number | null;
  subjectId: string;
  url: string;
};

const expectedPath = (rtId: string): string => `/${rtId}`;

const readPageIdentity = (html: string): PageIdentity => {
  const canonical = html.match(
    /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'](?<href>[^"']+)["'])[^>]*>/iu
  )?.groups?.href;
  const jsonLd: Record<string, unknown>[] = [];
  for (const match of html.matchAll(
    /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>(?<body>[\s\S]*?)<\/script>/giu
  )) {
    try {
      const parsed: unknown = JSON.parse(match.groups?.body?.trim() ?? "");
      for (const value of Array.isArray(parsed) ? parsed : [parsed]) {
        if (value && typeof value === "object") {
          jsonLd.push(value as Record<string, unknown>);
        }
      }
    } catch {
      // Ignore unrelated invalid JSON-LD; the scorecard and other identity data are checked separately.
    }
  }
  return { canonicalUrl: canonical ?? null, jsonLd };
};

const readPageTypes = (page: PageIdentity): Set<string> =>
  new Set(
    page.jsonLd.flatMap((value) => {
      const type = value["@type"];
      if (Array.isArray(type)) {
        return type.filter((item): item is string => typeof item === "string");
      }
      return typeof type === "string" ? [type] : [];
    })
  );

const readSeasonNumber = (page: PageIdentity, html: string): number | null => {
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

const scoreValue = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }
  const match = String(value)
    .trim()
    .match(/^(?<score>\d{1,3}(?:\.\d+)?)\s*%?$/u);
  if (!match) {
    return null;
  }
  const score = Number(match.groups?.score);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
};

const countValue = (value: unknown): RtCount | null => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0
      ? { kind: "exact", value }
      : null;
  }
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  if (/\b(?:fewer|less) than\b/iu.test(value)) {
    return null;
  }
  const match = value
    .replaceAll(",", "")
    .match(/(?:^|\s)(?<count>\d+)(?<plus>\+)?(?:\s|$)/u);
  const rawCount = match?.groups?.count;
  if (!rawCount) {
    return null;
  }
  const count = Number(rawCount);
  if (!Number.isSafeInteger(count) || count < 0) {
    return null;
  }
  return match.groups?.plus
    ? { kind: "range", lowerBound: count }
    : { kind: "exact", value: count };
};

const sameCount = (left: unknown, right: unknown): boolean => {
  const leftCount = countValue(left);
  const rightCount = countValue(right);
  if (!leftCount && !rightCount) {
    return true;
  }
  return Boolean(
    leftCount &&
    rightCount &&
    leftCount.kind === rightCount.kind &&
    (leftCount.kind === "exact"
      ? rightCount.kind === "exact" && leftCount.value === rightCount.value
      : rightCount.kind === "range" &&
        leftCount.lowerBound === rightCount.lowerBound)
  );
};

const audienceGroup = (scorecard: Scorecard): "all" | "verified" | null => {
  const audience = scorecard.audienceScore;
  if (!audience || scorecard.hideAudienceScore) {
    return null;
  }
  const defaultScore = scoreValue(audience.scorePercent);
  if (defaultScore === null) {
    return null;
  }
  const defaultCount = audience.bandedRatingCount ?? audience.ratingCount;
  const { overlay } = scorecard;
  const candidates = [
    ...(overlay?.hasAudienceAll && overlay.audienceAll
      ? ([{ group: "all" as const, score: overlay.audienceAll }] as const)
      : []),
    ...(overlay?.hasAudienceVerified && overlay.audienceVerified
      ? ([
          { group: "verified" as const, score: overlay.audienceVerified },
        ] as const)
      : []),
  ].filter(
    ({ score }) =>
      scoreValue(score.scorePercent) === defaultScore &&
      sameCount(score.bandedRatingCount ?? score.ratingCount, defaultCount)
  );
  if (candidates.length !== 1) {
    return null;
  }
  return candidates[0]?.group ?? null;
};

const matchesScorecardObject = (
  page: PageIdentity,
  html: string,
  input: ScorecardInput
): boolean => {
  if (!page.canonicalUrl) {
    return false;
  }
  const canonical = new URL(page.canonicalUrl, input.url);
  const request = new URL(input.url);
  if (
    canonical.hostname !== "www.rottentomatoes.com" ||
    canonical.pathname !== expectedPath(input.rtId) ||
    canonical.pathname !== request.pathname
  ) {
    return false;
  }
  const types = readPageTypes(page);
  if (input.kind === "movie") {
    return types.has("Movie");
  }
  if (input.kind === "series") {
    return types.has("TVSeries");
  }
  return (
    types.has("TVSeason") &&
    input.season !== null &&
    readSeasonNumber(page, html) === input.season
  );
};

const readScorecard = (html: string): Scorecard | null => {
  const script = html.match(
    /<script\b(?=[^>]*\bdata-json=["']mediaScorecard["'])[^>]*>(?<body>[\s\S]*?)<\/script>/iu
  )?.groups?.body;
  if (!script) {
    return null;
  }
  try {
    return JSON.parse(script.trim()) as Scorecard;
  } catch {
    return null;
  }
};

const buildRating = (
  data: Scorecard,
  input: ScorecardInput,
  sourceUrl: string
): RtRating | null => {
  const critics = data.criticsScore;
  const audience = data.audienceScore;
  const criticsScore = scoreValue(critics?.scorePercent);
  const audienceHidden =
    data.hideAudienceScore === true ||
    audience?.hidden === true ||
    audience?.isHidden === true;
  const group = audienceHidden ? null : audienceGroup(data);
  const audienceScore = group ? scoreValue(audience?.scorePercent) : null;
  if (criticsScore === null && audienceScore === null) {
    return null;
  }
  return {
    audienceCount: group
      ? countValue(audience?.bandedRatingCount ?? audience?.ratingCount)
      : null,
    audienceGroup: group,
    audienceScore,
    criticsCount: countValue(
      critics?.ratingCount ?? critics?.bandedRatingCount
    ),
    criticsScore,
    fetchedAt: input.fetchedAt,
    object: { kind: input.kind, rtId: input.rtId, subjectId: input.subjectId },
    sourceUrl,
    stale: false,
  };
};

const parseScorecard = (
  html: string,
  input: ScorecardInput
): RtRating | null => {
  const page = readPageIdentity(html);
  if (!matchesScorecardObject(page, html, input) || !page.canonicalUrl) {
    return null;
  }
  const scorecard = readScorecard(html);
  return scorecard
    ? buildRating(scorecard, input, new URL(page.canonicalUrl, input.url).href)
    : null;
};

const findSeasonPath = (
  html: string,
  seriesRtId: string,
  season: number
): string | null => {
  const page = readPageIdentity(html);
  if (!readPageTypes(page).has("TVSeries")) {
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

export { findSeasonPath, parseScorecard, readPageIdentity, readPageTypes };
