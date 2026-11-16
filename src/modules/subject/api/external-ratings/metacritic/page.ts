import type { McScore } from "@/modules/subject/domain";
import type { WorkIdentityEvidence } from "@/modules/subject/resolve/types";

import { readStructuredPage, structuredTypes } from "../shared/structured-page";
import type { StructuredPage } from "../shared/structured-page";
import { hasExactIdentityEvidence } from "./page-identity";
import type { AliasEvidenceResult } from "./page-identity";
import { pagePath } from "./page-url";
import type { MetacriticTarget } from "./wikidata/claims";

type PageData = StructuredPage;
type PageRating =
  | { rating: McScore; status: "matched" }
  | { status: "invalid-page" | "no-rating" };

const targetEntry = (
  page: PageData,
  target: MetacriticTarget,
  expectedSeriesUrl: string | null | undefined = target.seriesMetacriticId
): Record<string, unknown> | null => {
  const expectedSeriesPath = expectedSeriesUrl
    ? pagePath(expectedSeriesUrl)
    : null;
  const targetPath = pagePath(`/${target.metacriticId}`);
  const canonicalPath = page.canonicalUrl ? pagePath(page.canonicalUrl) : null;
  const typedEntries = page.jsonLd.filter((entry) => {
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
    const seriesPath =
      typeof seriesUrl === "string" ? pagePath(seriesUrl) : null;
    return Boolean(
      seriesPath &&
      /^\/tv\/[^/]+$/u.test(seriesPath) &&
      (expectedSeriesPath === null || seriesPath === expectedSeriesPath)
    );
  });
  const expectedPaths = new Set(
    [canonicalPath, targetPath].filter(
      (value): value is string => value !== null
    )
  );
  const linkedEntries = typedEntries.filter((entry) => {
    const url = typeof entry.url === "string" ? entry.url : entry["@id"];
    return typeof url === "string" && expectedPaths.has(pagePath(url) ?? "");
  });
  if (linkedEntries.length === 1) {
    return linkedEntries[0] ?? null;
  }
  if (linkedEntries.length > 1) {
    return null;
  }
  return typedEntries.length === 1 ? (typedEntries[0] ?? null) : null;
};

const parseRating = (
  page: PageData,
  matchedEntry: Record<string, unknown>
): PageRating => {
  if (!page.canonicalUrl) {
    return { status: "invalid-page" };
  }
  const { aggregateRating } = matchedEntry;
  if (aggregateRating === null || aggregateRating === undefined) {
    return { status: "no-rating" };
  }
  if (typeof aggregateRating !== "object") {
    return { status: "invalid-page" };
  }
  const ratingValue = Reflect.get(aggregateRating, "ratingValue");
  const reviewCount = Reflect.get(aggregateRating, "reviewCount");
  if (
    ratingValue === null ||
    ratingValue === undefined ||
    (typeof ratingValue === "string" && !ratingValue.trim())
  ) {
    return { status: "invalid-page" };
  }
  const score = Math.trunc(Number(String(ratingValue).trim()));
  const countText =
    typeof reviewCount === "string"
      ? reviewCount.replaceAll(",", "").trim()
      : "";
  let countValue: number | null = null;
  if (typeof reviewCount === "number") {
    countValue = reviewCount;
  } else if (countText) {
    countValue = Number(countText);
  }
  const count =
    countValue !== null && Number.isSafeInteger(countValue) && countValue >= 0
      ? countValue
      : null;
  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100 ||
    (countValue !== null && count === null)
  ) {
    return { status: "invalid-page" };
  }
  return {
    rating: {
      reviewCount: count,
      score,
      sourceUrl: new URL(page.canonicalUrl, "https://www.metacritic.com").href,
    },
    status: "matched",
  };
};

type ReadMcPageOptions = {
  allowVerifiedSeasonAlias?: boolean;
  expectedSeriesUrl?: string | null;
  finalUrl?: string;
  identityEvidence?: WorkIdentityEvidence;
  identityNames?: string[];
  identityNamesComplete?: boolean;
};
type McPageReadResult =
  | {
      matchesTarget: false;
      rating: null;
      reason: "identity-conflict" | "invalid-page" | "request-error";
    }
  | {
      canonicalUrl: string;
      matchesTarget: true;
      rating: McScore | null;
      ratingStatus: "invalid-page" | "matched" | "no-rating";
      seriesUrl: string | null;
    };

const aliasFailureReason = (result: AliasEvidenceResult) =>
  result === "conflict" ? "identity-conflict" : "invalid-page";

const readMcPage = (
  html: string,
  target: MetacriticTarget,
  options: ReadMcPageOptions = {}
): McPageReadResult => {
  const page = readStructuredPage(html);
  if (
    !page.canonicalUrl ||
    (options.finalUrl &&
      pagePath(page.canonicalUrl) !== pagePath(options.finalUrl))
  ) {
    return { matchesTarget: false, rating: null, reason: "invalid-page" };
  }
  const entry = targetEntry(page, target, options.expectedSeriesUrl);
  if (!entry) {
    const hasTypedEntry = page.jsonLd.some(
      (candidate) => structuredTypes(candidate).length > 0
    );
    return {
      matchesTarget: false,
      rating: null,
      reason: hasTypedEntry ? "identity-conflict" : "invalid-page",
    };
  }
  if (pagePath(page.canonicalUrl) !== `/${target.metacriticId}`) {
    const verifiedSeasonAlias =
      target.kind === "season" && options.allowVerifiedSeasonAlias === true;
    if (!verifiedSeasonAlias) {
      const evidenceResult = hasExactIdentityEvidence(
        entry,
        target,
        options.identityEvidence,
        options.identityNames,
        options.identityNamesComplete
      );
      if (evidenceResult !== "matched") {
        return {
          matchesTarget: false,
          rating: null,
          reason: aliasFailureReason(evidenceResult),
        };
      }
    }
  }
  const partOfSeries = Reflect.get(entry, "partOfSeries");
  const seriesUrl =
    partOfSeries && typeof partOfSeries === "object"
      ? Reflect.get(partOfSeries, "url")
      : null;
  const parsedRating = parseRating(page, entry);
  return {
    canonicalUrl: new URL(page.canonicalUrl, "https://www.metacritic.com").href,
    matchesTarget: true,
    rating: parsedRating.status === "matched" ? parsedRating.rating : null,
    ratingStatus: parsedRating.status,
    seriesUrl: typeof seriesUrl === "string" ? seriesUrl : null,
  };
};

const parseMcPage = (html: string, target: MetacriticTarget): McScore | null =>
  readMcPage(html, target).rating;

export { parseMcPage, readMcPage, type McPageReadResult };
