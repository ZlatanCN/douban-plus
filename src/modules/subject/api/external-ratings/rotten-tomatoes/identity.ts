import type { RtObjectKind } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { readStructuredPage, structuredTypes } from "../shared/structured-page";
import { fetchEntityNames } from "../shared/wikidata-client";

type IdentityEvidence = {
  originalTitle: string;
  releaseYear: string;
};

type PageIdentity = {
  creators: string[];
  directors: string[];
  imdbIds: string[];
  releaseYear: string | null;
  title: string | null;
};

const normalizeIdentityText = (value: string): string =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll(/[\p{P}\p{Z}\s]/gu, "");

const readPeople = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(readPeople);
  }
  if (typeof value === "string") {
    return [value];
  }
  if (value && typeof value === "object") {
    const name = Reflect.get(value, "name");
    return typeof name === "string" ? [name] : [];
  }
  return [];
};

const readImdbId = (value: unknown): string | null => {
  if (typeof value === "string") {
    const id = value.trim().match(/^tt\d{7,}$/iu)?.[0];
    if (id) {
      return id.toLowerCase();
    }
    try {
      const url = new URL(value);
      const match = url.pathname.match(/^\/title\/(?<id>tt\d{7,})\/?$/iu);
      return /(?:^|\.)imdb\.com$/iu.test(url.hostname)
        ? (match?.groups?.id?.toLowerCase() ?? null)
        : null;
    } catch {
      return null;
    }
  }
  if (value && typeof value === "object") {
    const propertyId = Reflect.get(value, "propertyID");
    if (typeof propertyId === "string" && !/imdb/iu.test(propertyId)) {
      return null;
    }
    const identifier = Reflect.get(value, "value");
    return readImdbId(identifier);
  }
  return null;
};

const readImdbIds = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value])
    .map(readImdbId)
    .filter((id): id is string => id !== null);

const readSemanticValue = (html: string, label: string): string | null => {
  const document = new DOMParser().parseFromString(html, "text/html");
  const term = [...document.querySelectorAll("dt")].find(
    (candidate) => candidate.textContent?.trim() === label
  );
  const value = term?.nextElementSibling?.textContent?.trim();
  return value || null;
};

const readYear = (value: string | null | undefined): string | null =>
  value?.match(/\b(?<year>\d{4})\b/u)?.groups?.year ?? null;

const readPageIdentity = (
  html: string,
  kind: Extract<RtObjectKind, "movie" | "series">
): PageIdentity | null => {
  const page = readStructuredPage(html);
  const expectedType = kind === "movie" ? "Movie" : "TVSeries";
  const work = page.jsonLd.find((entry) =>
    structuredTypes(entry).includes(expectedType)
  );
  if (!work) {
    return null;
  }
  const title = typeof work.name === "string" ? work.name : null;
  const semanticDate = readSemanticValue(
    html,
    kind === "movie" ? "Release Date (Theaters)" : "Release Date"
  );
  const schemaDate =
    kind === "series" && typeof work.startDate === "string"
      ? work.startDate
      : undefined;
  const releaseYear = readYear(semanticDate) ?? readYear(schemaDate);
  const creatorDetails = readSemanticValue(html, "Creator");
  const directors = [
    ...readPeople(work.director),
    ...readPeople(readSemanticValue(html, "Director")),
  ];
  const creators = [
    ...readPeople(work.creator),
    ...readPeople(work.author),
    ...(creatorDetails?.split(/\s*,\s*/u).filter(Boolean) ?? []),
  ];
  const imdbIds = [
    ...readImdbIds(work.sameAs),
    ...readImdbIds(work.identifier),
  ];
  return {
    creators,
    directors,
    imdbIds: [...new Set(imdbIds)],
    releaseYear,
    title,
  };
};

const hasMatchingName = (expected: string[], actual: string[]): boolean =>
  expected.some((expectedName) => {
    const normalizedExpected = normalizeIdentityText(expectedName);
    return (
      normalizedExpected.length > 0 &&
      actual.some(
        (actualName) => normalizeIdentityText(actualName) === normalizedExpected
      )
    );
  });

type RtAliasIdentityInput = {
  evidence: IdentityEvidence;
  expectedStableIds: string[];
  html: string;
  imdbId: string | null;
  kind: Extract<RtObjectKind, "movie" | "series">;
};

type AliasProof = "conflict" | "matched" | "unavailable";

const stableIdentityMatch = (
  input: RtAliasIdentityInput
): AliasProof | null => {
  const page = readPageIdentity(input.html, input.kind);
  if (!page) {
    return "unavailable";
  }
  const stableIds = [
    ...new Set(
      [...input.expectedStableIds, ...(input.imdbId ? [input.imdbId] : [])].map(
        (id) => id.toLowerCase()
      )
    ),
  ];
  if (stableIds.length > 0 && page.imdbIds.length > 0) {
    return page.imdbIds.length === 1 &&
      stableIds.length === 1 &&
      page.imdbIds[0] === stableIds[0]
      ? "matched"
      : "conflict";
  }
  return null;
};

const provesRtAlias = (
  input: RtAliasIdentityInput & { verifiedNames: string[] }
): AliasProof => {
  const stableMatch = stableIdentityMatch(input);
  if (stableMatch !== null) {
    return stableMatch;
  }
  const page = readPageIdentity(input.html, input.kind);
  if (!page) {
    return "unavailable";
  }
  const actualNames = input.kind === "movie" ? page.directors : page.creators;
  if (
    !input.evidence.originalTitle ||
    !input.evidence.releaseYear ||
    !page.title ||
    !page.releaseYear ||
    input.verifiedNames.length === 0 ||
    actualNames.length === 0
  ) {
    return "unavailable";
  }
  if (
    page.releaseYear !== input.evidence.releaseYear ||
    normalizeIdentityText(page.title) !==
      normalizeIdentityText(input.evidence.originalTitle)
  ) {
    return "conflict";
  }
  return hasMatchingName(input.verifiedNames, actualNames)
    ? "matched"
    : "conflict";
};

const identityNamesFor = async (
  personIds: string[],
  signal: AbortSignal
): Promise<string[]> => {
  const ids = [...new Set(personIds)];
  if (ids.length === 0) {
    return [];
  }
  const namesById = await fetchEntityNames(ids, signal);
  return [...new Set(ids.flatMap((id) => namesById[id] ?? []))];
};

const verifiesRtAlias = async (
  input: RtAliasIdentityInput & { personIds: string[] },
  signal: AbortSignal
): Promise<AliasProof> => {
  const stableMatch = stableIdentityMatch(input);
  if (stableMatch !== null) {
    return stableMatch;
  }
  if (input.personIds.length === 0) {
    return "unavailable";
  }
  const verifiedNames = await identityNamesFor(input.personIds, signal);
  return provesRtAlias({ ...input, verifiedNames });
};

const contextIdentityEvidence = (
  context: ResolutionContext
): IdentityEvidence | null => {
  const value = Reflect.get(context, "identityEvidence");
  return value && typeof value === "object"
    ? (value as IdentityEvidence)
    : null;
};

export { contextIdentityEvidence, verifiesRtAlias };
