import type { WorkIdentityEvidence } from "@/modules/subject/resolve/types";

import { pagePath } from "./page-url";
import type { MetacriticTarget } from "./wikidata/claims";

const normalizeIdentityText = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replaceAll(/[\p{P}\p{Z}\s]+/gu, "");

const metadataYear = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.match(/\b(?<year>(?:19|20)\d{2})\b/u)?.groups?.year ?? "";
};

const namesIn = (value: unknown): string[] => {
  const entries = Array.isArray(value) ? value : [value];
  return entries.flatMap((entry) => {
    if (typeof entry === "string") {
      return [entry];
    }
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const name = Reflect.get(entry, "name");
    return typeof name === "string" ? [name] : [];
  });
};

type AliasEvidenceResult = "conflict" | "insufficient" | "matched";

const hasMatchingPersonName = (
  identity: Record<string, unknown>,
  target: MetacriticTarget,
  evidence: WorkIdentityEvidence,
  identityNames: string[] | undefined,
  identityNamesComplete: boolean | undefined
): AliasEvidenceResult => {
  const contextNames =
    target.kind === "movie" ? evidence.directors : evidence.creators;
  const expectedNames = [
    ...new Set([...(identityNames ?? []), ...contextNames]),
  ];
  const actualNames =
    target.kind === "movie"
      ? namesIn(identity.director)
      : namesIn(identity.creator);
  if (actualNames.length === 0) {
    return "insufficient";
  }
  const normalizedNames = new Set(actualNames.map(normalizeIdentityText));
  if (
    expectedNames.some((name) =>
      normalizedNames.has(normalizeIdentityText(name))
    )
  ) {
    return "matched";
  }
  const mappedPeople =
    target.kind === "movie"
      ? target.identityReferences.directors
      : target.identityReferences.creators;
  return expectedNames.length === 0 ||
    (mappedPeople.length > 0 && identityNamesComplete !== true)
    ? "insufficient"
    : "conflict";
};

const hasExactIdentityEvidence = (
  entry: Record<string, unknown>,
  target: MetacriticTarget,
  evidence: WorkIdentityEvidence | undefined,
  identityNames: string[] | undefined,
  identityNamesComplete: boolean | undefined
): AliasEvidenceResult => {
  if (!evidence?.originalTitle || !evidence.releaseYear) {
    return "insufficient";
  }
  const identity =
    target.kind === "season" &&
    entry.partOfSeries &&
    typeof entry.partOfSeries === "object"
      ? (entry.partOfSeries as Record<string, unknown>)
      : entry;
  const title = identity.name;
  const releaseYear = metadataYear(identity.datePublished);
  if (typeof title !== "string" || !releaseYear) {
    return "insufficient";
  }
  if (
    normalizeIdentityText(title) !==
      normalizeIdentityText(evidence.originalTitle) ||
    releaseYear !== evidence.releaseYear
  ) {
    return "conflict";
  }
  return hasMatchingPersonName(
    identity,
    target,
    evidence,
    identityNames,
    identityNamesComplete
  );
};

const findSeasonPageLink = (
  html: string,
  seriesPageUrl: string,
  season: number
): string | null => {
  const seriesPath = pagePath(seriesPageUrl);
  if (!seriesPath || !/^\/tv\/[^/]+$/u.test(seriesPath)) {
    return null;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const matchingLinks = [...doc.querySelectorAll<HTMLAnchorElement>("a[href]")]
    .map((anchor) => {
      try {
        return new URL(anchor.getAttribute("href") ?? "", seriesPageUrl);
      } catch {
        return null;
      }
    })
    .filter((url): url is URL => url !== null)
    .filter((url) => {
      const linkedPath = pagePath(url.href);
      const match = linkedPath?.match(/^\/tv\/[^/]+\/season-(?<season>\d+)$/u);
      return (
        linkedPath?.startsWith(`${seriesPath}/season-`) === true &&
        Number(match?.groups?.season) === season
      );
    });
  const uniquePaths = [
    ...new Set(matchingLinks.map((url) => pagePath(url.href))),
  ];
  if (uniquePaths.length !== 1) {
    return null;
  }
  const [path] = uniquePaths;
  return path ? `https://www.metacritic.com${path}/` : null;
};

export {
  findSeasonPageLink,
  hasExactIdentityEvidence,
  type AliasEvidenceResult,
};
