import type { RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";
import { gmGetResponse } from "@/shared/utils/request";

import {
  findSeasonPath,
  parseScorecard,
  readPageIdentity,
  readPageTypes,
} from "./rotten-parser";
import {
  readSnapshot,
  readUniqueSnapshot,
  removeSnapshot,
  writeSnapshot,
} from "./rotten-snapshot";
import { resolveRottenMapping } from "./rotten-wikidata";

const RT_ORIGIN = "https://www.rottentomatoes.com";
const REQUEST_TIMEOUT = 8000;

type RtResolution = {
  rating: RtRating | null;
  status:
    | "aborted"
    | "cached"
    | "error"
    | "identity-conflict"
    | "missing-mapping"
    | "no-rating"
    | "refreshed"
    | "season-unmatched"
    | "stale";
};

type OnRtResolution = (result: RtResolution) => void;

const ratingFailure = (
  status: RtResolution["status"],
  rating: RtRating | null = null
): RtResolution => ({ rating, status });

const rtUrl = (rtId: string): string => `${RT_ORIGIN}/${rtId}`;

const pathMatches = (url: string, rtId: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.rottentomatoes.com" &&
      parsed.pathname === `/${rtId}` &&
      !parsed.search
    );
  } catch {
    return false;
  }
};

const requestPage = async (
  rtId: string,
  signal: AbortSignal
): Promise<{ html: string; url: string }> => {
  const url = rtUrl(rtId);
  const response = await gmGetResponse(url, `${RT_ORIGIN}/`, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  if (
    response.status < 200 ||
    response.status >= 400 ||
    !pathMatches(response.finalUrl, rtId)
  ) {
    throw new Error("Rotten Tomatoes response did not match its mapped page");
  }
  return { html: response.responseText, url };
};

const isSeriesPage = (html: string, rtId: string, url: string): boolean => {
  const canonical = readPageIdentity(html).canonicalUrl;
  return Boolean(
    canonical &&
    pathMatches(canonical, rtId) &&
    readPageTypes(readPageIdentity(html)).has("TVSeries") &&
    pathMatches(url, rtId)
  );
};

const getSnapshotObject = (
  context: ResolutionContext,
  rtId: string
): RtRating["object"] => ({
  kind: context.kind,
  rtId,
  subjectId: context.subjectId,
});

type TargetResult = { rtId: string } | { failure: RtResolution };

const resolveTarget = async (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<TargetResult> => {
  const mapping = await resolveRottenMapping(context, signal);
  if (signal.aborted) {
    return { failure: ratingFailure("aborted") };
  }
  if (mapping.status === "unavailable") {
    if (mapping.reason === "conflict") {
      return { failure: ratingFailure("identity-conflict") };
    }
    if (mapping.reason === "season") {
      return { failure: ratingFailure("season-unmatched") };
    }
    if (mapping.reason === "error") {
      return { failure: ratingFailure("error") };
    }
    return { failure: ratingFailure("missing-mapping") };
  }

  if (!mapping.needsSeasonLink) {
    return { rtId: mapping.rtId };
  }
  const seriesPage = await requestPage(mapping.rtId, signal);
  if (signal.aborted) {
    return { failure: ratingFailure("aborted") };
  }
  if (!isSeriesPage(seriesPage.html, mapping.rtId, seriesPage.url)) {
    return { failure: ratingFailure("identity-conflict") };
  }
  if (context.season === null) {
    return { failure: ratingFailure("season-unmatched") };
  }
  const seasonPath = findSeasonPath(
    seriesPage.html,
    mapping.rtId,
    context.season
  );
  return seasonPath
    ? { rtId: seasonPath }
    : { failure: ratingFailure("season-unmatched") };
};

const loadRating = async (
  context: ResolutionContext,
  rtId: string,
  object: RtRating["object"],
  prior: RtRating | null,
  signal: AbortSignal,
  onResult?: OnRtResolution
): Promise<RtResolution> => {
  if (prior && !prior.stale) {
    const result = { rating: prior, status: "cached" } satisfies RtResolution;
    onResult?.(result);
    return result;
  }
  if (prior) {
    onResult?.({ rating: prior, status: "stale" });
  }

  const page = await requestPage(rtId, signal);
  if (signal.aborted) {
    return ratingFailure("aborted");
  }
  const rating = parseScorecard(page.html, {
    fetchedAt: Date.now(),
    kind: context.kind,
    rtId,
    season: context.season,
    subjectId: context.subjectId,
    url: page.url,
  });
  if (!rating) {
    removeSnapshot(object);
    return ratingFailure("no-rating");
  }
  writeSnapshot(rating);
  return { rating, status: "refreshed" };
};

const fallbackSnapshot = (
  context: ResolutionContext,
  object: RtRating["object"] | null,
  prior: RtRating | null,
  onResult?: OnRtResolution
): RtResolution => {
  const rating =
    prior ??
    (object === null
      ? readUniqueSnapshot(context.subjectId, context.kind)
      : readSnapshot(object));
  if (!rating) {
    return ratingFailure("error");
  }
  const result = { rating, status: "stale" } satisfies RtResolution;
  onResult?.(result);
  return result;
};

const fetchRtRating = async (
  context: ResolutionContext,
  signal: AbortSignal,
  onResult?: OnRtResolution
): Promise<RtResolution> => {
  let object: RtRating["object"] | null = null;
  let prior: RtRating | null = null;
  try {
    const target = await resolveTarget(context, signal);
    if ("failure" in target) {
      if (target.failure.status === "error") {
        return fallbackSnapshot(context, null, null, onResult);
      }
      return target.failure;
    }
    object = getSnapshotObject(context, target.rtId);
    prior = readSnapshot(object);
    return await loadRating(
      context,
      target.rtId,
      object,
      prior,
      signal,
      onResult
    );
  } catch {
    if (signal.aborted) {
      return ratingFailure("aborted");
    }
    return fallbackSnapshot(context, object, prior, onResult);
  }
};

export { fetchRtRating };
export type { RtResolution };
