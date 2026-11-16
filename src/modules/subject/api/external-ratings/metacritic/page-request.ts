import { fetchEntityNames } from "@/modules/subject/api/external-ratings/shared/wikidata-client";
import type { ResolutionContext } from "@/modules/subject/resolve/types";
import { gmGetResponse } from "@/shared/utils/request";

import { readStructuredPage } from "../shared/structured-page";
import { readMcPage } from "./page";
import { pagePath } from "./page-url";
import type { MetacriticTarget } from "./wikidata/claims";

const METACRITIC_ORIGIN = "https://www.metacritic.com";
const REQUEST_TIMEOUT = 8000;

type McPageResponse = {
  finalUrl: string;
  responseText: string;
  status: number;
};
type IdentityNameResolution = { complete: boolean; names: string[] };

const requestMcPage = async (
  targetUrl: string,
  signal: AbortSignal
): Promise<McPageResponse> => {
  if (!pagePath(targetUrl)) {
    throw new Error("Metacritic target URL is invalid");
  }
  const response = await gmGetResponse(targetUrl, `${METACRITIC_ORIGIN}/`, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  if (
    response.status < 200 ||
    response.status >= 400 ||
    pagePath(response.finalUrl) === null
  ) {
    throw new Error("Metacritic response did not match its mapped page");
  }
  return response;
};

const identityNamesForAlias = async (
  html: string,
  target: MetacriticTarget,
  signal: AbortSignal
): Promise<IdentityNameResolution> => {
  const { canonicalUrl } = readStructuredPage(html);
  if (!canonicalUrl || pagePath(canonicalUrl) === `/${target.metacriticId}`) {
    return { complete: true, names: [] };
  }
  const ids =
    target.kind === "movie"
      ? target.identityReferences.directors
      : target.identityReferences.creators;
  if (ids.length === 0) {
    return { complete: true, names: [] };
  }
  try {
    const namesById = await fetchEntityNames(ids, signal);
    return {
      complete: ids.every((id) => (namesById[id]?.length ?? 0) > 0),
      names: [...new Set(Object.values(namesById).flat())],
    };
  } catch {
    return { complete: false, names: [] };
  }
};

const readVerifiedSeasonPage = async (
  context: ResolutionContext,
  response: McPageResponse,
  target: MetacriticTarget,
  identityNameResolution: IdentityNameResolution,
  signal: AbortSignal
): Promise<ReturnType<typeof readMcPage>> => {
  const directPage = readMcPage(response.responseText, target, {
    expectedSeriesUrl: target.seriesMetacriticId,
    finalUrl: response.finalUrl,
    identityNames: identityNameResolution.names,
    identityNamesComplete: identityNameResolution.complete,
    identityEvidence: context.identityEvidence,
  });
  if (directPage.matchesTarget || target.kind !== "season") {
    return directPage;
  }
  if (!target.seriesMetacriticId) {
    return directPage;
  }
  const candidatePage = readMcPage(response.responseText, target, {
    allowVerifiedSeasonAlias: true,
    expectedSeriesUrl: null,
    finalUrl: response.finalUrl,
    identityEvidence: context.identityEvidence,
  });
  if (!candidatePage.matchesTarget || !candidatePage.seriesUrl) {
    return candidatePage;
  }
  const candidateSeriesPath = pagePath(candidatePage.seriesUrl);
  const mappedSeriesPath = pagePath(target.seriesMetacriticId);
  if (!candidateSeriesPath || !mappedSeriesPath) {
    return { matchesTarget: false, rating: null, reason: "invalid-page" };
  }
  if (candidateSeriesPath === mappedSeriesPath) {
    return readMcPage(response.responseText, target, {
      allowVerifiedSeasonAlias: true,
      expectedSeriesUrl: candidatePage.seriesUrl,
      finalUrl: response.finalUrl,
      identityNames: identityNameResolution.names,
      identityNamesComplete: identityNameResolution.complete,
      identityEvidence: context.identityEvidence,
    });
  }

  const seriesTarget: MetacriticTarget = {
    kind: "series",
    identityReferences: target.identityReferences,
    metacriticId: target.seriesMetacriticId,
    season: null,
    seriesId: target.seriesId,
    seriesMetacriticId: target.seriesMetacriticId,
    status: "matched",
  };
  let seriesResponse: McPageResponse;
  try {
    seriesResponse = await requestMcPage(
      `${METACRITIC_ORIGIN}/${target.seriesMetacriticId}/`,
      signal
    );
  } catch {
    return { matchesTarget: false, rating: null, reason: "invalid-page" };
  }
  const seriesNames = await identityNamesForAlias(
    seriesResponse.responseText,
    seriesTarget,
    signal
  );
  const seriesPage = readMcPage(seriesResponse.responseText, seriesTarget, {
    finalUrl: seriesResponse.finalUrl,
    identityNames: seriesNames.names,
    identityNamesComplete: seriesNames.complete,
    identityEvidence: context.identityEvidence,
  });
  if (!seriesPage.matchesTarget || !seriesPage.canonicalUrl) {
    return seriesPage.matchesTarget
      ? { matchesTarget: false, rating: null, reason: "invalid-page" }
      : seriesPage;
  }
  if (pagePath(seriesPage.canonicalUrl) !== candidateSeriesPath) {
    return {
      matchesTarget: false,
      rating: null,
      reason: "identity-conflict",
    };
  }
  return readMcPage(response.responseText, target, {
    allowVerifiedSeasonAlias: true,
    expectedSeriesUrl: seriesPage.canonicalUrl,
    finalUrl: response.finalUrl,
    identityNames: identityNameResolution.names,
    identityNamesComplete: identityNameResolution.complete,
    identityEvidence: context.identityEvidence,
  });
};

export {
  METACRITIC_ORIGIN,
  identityNamesForAlias,
  readVerifiedSeasonPage,
  requestMcPage,
  type IdentityNameResolution,
  type McPageResponse,
};
