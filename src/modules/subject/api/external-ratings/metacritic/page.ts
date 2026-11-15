import type { McRating } from "@/modules/subject/domain";

import { readStructuredPage, structuredTypes } from "../shared/structured-page";
import type { StructuredPage } from "../shared/structured-page";
import type { MetacriticTarget } from "./wikidata/claims";

type PageData = StructuredPage;

const METACRITIC_ORIGIN = "https://www.metacritic.com";

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

const targetEntry = (
  page: PageData,
  target: MetacriticTarget
): Record<string, unknown> | null => {
  const expectedPath = `/${target.metacriticId}`;
  if (!page.canonicalUrl || pagePath(page.canonicalUrl) !== expectedPath) {
    return null;
  }
  const expectedSeriesPath = target.metacriticId.replace(/\/season-\d+$/u, "");
  return (
    page.jsonLd.find((entry) => {
      const types = new Set(structuredTypes(entry));
      if (target.kind === "movie") {
        return types.has("Movie");
      }
      if (target.kind === "series") {
        return types.has("TVSeries");
      }
      if (
        !types.has("TVSeason") ||
        Number(entry.seasonNumber) !== target.season
      ) {
        return false;
      }
      const { partOfSeries } = entry;
      const seriesUrl =
        partOfSeries && typeof partOfSeries === "object"
          ? Reflect.get(partOfSeries, "url")
          : null;
      return (
        typeof seriesUrl === "string" &&
        pagePath(seriesUrl) === `/${expectedSeriesPath}`
      );
    }) ?? null
  );
};

const parseRating = (
  page: PageData,
  matchedEntry: Record<string, unknown>
): McRating | null => {
  if (!page.canonicalUrl) {
    return null;
  }
  const { aggregateRating } = matchedEntry;
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
  return {
    reviewCount: count,
    score,
    sourceUrl: new URL(page.canonicalUrl, METACRITIC_ORIGIN).href,
  };
};

const readMcPage = (
  html: string,
  target: MetacriticTarget
):
  | { matchesTarget: false; rating: null }
  | { matchesTarget: true; rating: McRating | null } => {
  const page = readStructuredPage(html);
  const entry = targetEntry(page, target);
  return entry
    ? { matchesTarget: true, rating: parseRating(page, entry) }
    : { matchesTarget: false, rating: null };
};

const parseMcPage = (html: string, target: MetacriticTarget): McRating | null =>
  readMcPage(html, target).rating;

export { pagePath, parseMcPage, readMcPage };
