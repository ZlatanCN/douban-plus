import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { readMcPage } from "./page";
import { findSeasonPageLink } from "./page-identity";
import {
  identityNamesForAlias,
  METACRITIC_ORIGIN,
  requestMcPage,
} from "./page-request";
import { pagePath } from "./page-url";
import type { MetacriticTarget } from "./wikidata/claims";
import type { MetacriticTargetResolution } from "./wikidata/resolve";

const finishSeasonLinkResolution = async (
  context: ResolutionContext,
  resolution: MetacriticTargetResolution,
  signal: AbortSignal
): Promise<MetacriticTargetResolution> => {
  if (resolution.status !== "season-link-needed" || !resolution.complete) {
    return resolution;
  }
  try {
    const seriesResponse = await requestMcPage(
      `${METACRITIC_ORIGIN}/${resolution.seriesTarget.metacriticId}/`,
      signal
    );
    const identityNames = await identityNamesForAlias(
      seriesResponse.responseText,
      resolution.seriesTarget,
      signal
    );
    const seriesPage = readMcPage(
      seriesResponse.responseText,
      resolution.seriesTarget,
      {
        finalUrl: seriesResponse.finalUrl,
        identityNames: identityNames.names,
        identityNamesComplete: identityNames.complete,
        identityEvidence: context.identityEvidence,
      }
    );
    if (seriesPage.matchesTarget === false) {
      return seriesPage.reason === "identity-conflict"
        ? { complete: true, status: "identity-conflict" }
        : {
            complete: false,
            failure:
              seriesPage.reason === "request-error"
                ? "request-error"
                : "parse-error",
            status: "error",
          };
    }
    if (!seriesPage.canonicalUrl) {
      return { complete: false, failure: "parse-error", status: "error" };
    }
    const seasonUrl = findSeasonPageLink(
      seriesResponse.responseText,
      seriesPage.canonicalUrl,
      resolution.season
    );
    if (!seasonUrl) {
      return { complete: true, status: "missing" };
    }
    const seasonResponse = await requestMcPage(seasonUrl, signal);
    const seasonPath = pagePath(seasonResponse.finalUrl);
    const seriesPath = pagePath(seriesPage.canonicalUrl);
    if (!seasonPath || !seriesPath) {
      return { complete: false, failure: "parse-error", status: "error" };
    }
    const seasonMatch = seasonPath.match(
      /^\/tv\/[^/]+\/season-(?<season>\d+)$/u
    );
    if (Number(seasonMatch?.groups?.season) !== resolution.season) {
      return { complete: true, status: "identity-conflict" };
    }
    const target: MetacriticTarget = {
      kind: "season",
      identityReferences: resolution.seriesTarget.identityReferences,
      metacriticId: seasonPath.replaceAll(/^\/+|\/+$/gu, ""),
      season: resolution.season,
      seriesId: resolution.seriesTarget.seriesId,
      seriesMetacriticId: seriesPath.replaceAll(/^\/+|\/+$/gu, ""),
      status: "matched",
    };
    const seasonIdentityNames = await identityNamesForAlias(
      seasonResponse.responseText,
      target,
      signal
    );
    const seasonPage = readMcPage(seasonResponse.responseText, target, {
      expectedSeriesUrl: seriesPage.canonicalUrl,
      finalUrl: seasonResponse.finalUrl,
      allowVerifiedSeasonAlias: true,
      identityNames: seasonIdentityNames.names,
      identityNamesComplete: seasonIdentityNames.complete,
      identityEvidence: context.identityEvidence,
    });
    if (seasonPage.matchesTarget === false) {
      return seasonPage.reason === "identity-conflict"
        ? { complete: true, status: "identity-conflict" }
        : {
            complete: false,
            failure:
              seasonPage.reason === "request-error"
                ? "request-error"
                : "parse-error",
            status: "error",
          };
    }
    return { complete: true, status: "matched", target };
  } catch (error) {
    return {
      complete: false,
      failure: error instanceof SyntaxError ? "parse-error" : "request-error",
      status: "error",
    };
  }
};

export { finishSeasonLinkResolution };
