import type { McScore } from "@/modules/subject/domain";
import type { WorkIdentityEvidence } from "@/modules/subject/resolve/types";

import { readStructuredPage, structuredTypes } from "../shared/structured-page";
import type { StructuredPage } from "../shared/structured-page";
import { hasExactIdentityEvidence } from "./page-identity";
import type { AliasEvidenceResult } from "./page-identity";
import { readPageRating } from "./page-rating";
import { pagePath } from "./page-url";
import type { MetacriticTarget } from "./wikidata/claims";

type PageData = StructuredPage;

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
      rating: McScore;
      ratingStatus: "matched";
      seriesUrl: string | null;
    }
  | {
      canonicalUrl: string;
      matchesTarget: true;
      rating: McScore;
      ratingError: string;
      ratingStatus: "partial-error";
      seriesUrl: string | null;
    }
  | {
      canonicalUrl: string;
      matchesTarget: true;
      rating: null;
      ratingStatus: "no-rating";
      seriesUrl: string | null;
    }
  | {
      canonicalUrl: string;
      matchesTarget: true;
      rating: null;
      ratingError: string;
      ratingStatus: "invalid-page";
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
  const parsedRating = readPageRating(html, page, target, entry);
  const canonicalUrl = new URL(page.canonicalUrl, "https://www.metacritic.com")
    .href;
  const pageSeriesUrl = typeof seriesUrl === "string" ? seriesUrl : null;
  if (parsedRating.status === "matched") {
    return {
      canonicalUrl,
      matchesTarget: true,
      rating: parsedRating.rating,
      ratingStatus: parsedRating.status,
      seriesUrl: pageSeriesUrl,
    };
  }
  if (parsedRating.status === "partial-error") {
    return {
      canonicalUrl,
      matchesTarget: true,
      rating: parsedRating.rating,
      ratingError: parsedRating.reason,
      ratingStatus: parsedRating.status,
      seriesUrl: pageSeriesUrl,
    };
  }
  if (parsedRating.status === "no-rating") {
    return {
      canonicalUrl,
      matchesTarget: true,
      rating: null,
      ratingStatus: parsedRating.status,
      seriesUrl: pageSeriesUrl,
    };
  }
  return {
    canonicalUrl,
    matchesTarget: true,
    rating: null,
    ratingError: parsedRating.reason,
    ratingStatus: parsedRating.status,
    seriesUrl: pageSeriesUrl,
  };
};

export { readMcPage, type McPageReadResult };
