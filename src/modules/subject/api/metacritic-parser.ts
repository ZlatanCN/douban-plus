import type { McRating } from "@/modules/subject/domain";

import type { MetacriticTarget } from "./metacritic-wikidata-claims";

type PageData = {
  canonicalUrl: string | null;
  jsonLd: Record<string, unknown>[];
};

const METACRITIC_ORIGIN = "https://www.metacritic.com";

const readPageData = (html: string): PageData => {
  const canonicalUrl = html.match(
    /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'](?<href>[^"']+)["'])[^>]*>/iu
  )?.groups?.href;
  const jsonLd: Record<string, unknown>[] = [];
  for (const match of html.matchAll(
    /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>(?<body>[\s\S]*?)<\/script>/giu
  )) {
    try {
      const parsed: unknown = JSON.parse(match.groups?.body?.trim() ?? "");
      const values = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of values) {
        if (value && typeof value === "object") {
          jsonLd.push(value as Record<string, unknown>);
        }
      }
    } catch {
      // Ignore unrelated invalid JSON-LD.
    }
  }
  return { canonicalUrl: canonicalUrl ?? null, jsonLd };
};

const pagePath = (value: string): string | null => {
  try {
    const url = new URL(value, METACRITIC_ORIGIN);
    if (
      url.hostname !== "www.metacritic.com" &&
      url.hostname !== "metacritic.com"
    ) {
      return null;
    }
    return url.pathname.replaceAll(/\/+$/gu, "");
  } catch {
    return null;
  }
};

const pageTypes = (page: PageData): Set<string> =>
  new Set(
    page.jsonLd.flatMap((value) => {
      const type = value["@type"];
      if (Array.isArray(type)) {
        return type.filter((item): item is string => typeof item === "string");
      }
      return typeof type === "string" ? [type] : [];
    })
  );

const matchesTarget = (page: PageData, target: MetacriticTarget): boolean => {
  const expectedPath = `/${target.metacriticId}`;
  if (!page.canonicalUrl || pagePath(page.canonicalUrl) !== expectedPath) {
    return false;
  }
  const types = pageTypes(page);
  if (target.kind === "movie") {
    return types.has("Movie");
  }
  if (target.kind === "series") {
    return types.has("TVSeries");
  }
  const season = page.jsonLd.find((entry) => {
    const type = entry["@type"];
    return (
      type === "TVSeason" || (Array.isArray(type) && type.includes("TVSeason"))
    );
  });
  if (
    !types.has("TVSeason") ||
    Number(season?.seasonNumber) !== target.season
  ) {
    return false;
  }
  const partOfSeries = season?.partOfSeries;
  const seriesUrl =
    partOfSeries && typeof partOfSeries === "object"
      ? Reflect.get(partOfSeries, "url")
      : null;
  const expectedSeriesPath = target.metacriticId.replace(/\/season-\d+$/u, "");
  return (
    typeof seriesUrl === "string" &&
    pagePath(seriesUrl) === `/${expectedSeriesPath}`
  );
};

const parseRating = (
  page: PageData,
  target: MetacriticTarget
): McRating | null => {
  if (!matchesTarget(page, target)) {
    return null;
  }
  const aggregateRating = page.jsonLd.find(
    (entry) =>
      entry.aggregateRating && typeof entry.aggregateRating === "object"
  )?.aggregateRating;
  if (!aggregateRating || typeof aggregateRating !== "object") {
    return null;
  }
  const ratingValue = Reflect.get(aggregateRating, "ratingValue");
  const reviewCount = Reflect.get(aggregateRating, "reviewCount");
  if (ratingValue === null || reviewCount === null) {
    return null;
  }
  const score = Math.trunc(Number(String(ratingValue)));
  const count = Math.trunc(Number(String(reviewCount)));
  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100 ||
    !Number.isSafeInteger(count) ||
    count < 0
  ) {
    return null;
  }
  return { reviewCount: count, score };
};

const parseMcPage = (html: string, target: MetacriticTarget): McRating | null =>
  parseRating(readPageData(html), target);

const isMatchingMcPage = (html: string, target: MetacriticTarget): boolean =>
  matchesTarget(readPageData(html), target);

export { isMatchingMcPage, pagePath, parseMcPage };
