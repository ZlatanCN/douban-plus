import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import {
  readStructuredPage,
  structuredPageTypes,
} from "../shared/structured-page";
import { createVerifiedTargetCache } from "../shared/verified-target-cache";
import { contextIdentityEvidence, verifiesRtAlias } from "./identity";
import { isRtSeriesPage, requestRtPage } from "./page";
import { findSeasonPath } from "./parser";
import type { RottenMapping } from "./wikidata/claims";
import { resolveRottenMapping } from "./wikidata/resolve";

type ResolvedRtTarget = {
  identityImdbIds: string[];
  identityPersonIds: string[];
  rtId: string;
  seriesRtId: string | null;
};
type TargetFailure =
  | "aborted"
  | "error"
  | "identity-conflict"
  | "identity-unavailable"
  | "missing-mapping"
  | "parse-error"
  | "request-error"
  | "season-unmatched";
type RtTargetResult =
  | ResolvedRtTarget
  | ({ failure: TargetFailure } & Partial<
      Pick<
        ExternalRatingDiagnostic,
        | "acceptedEvidence"
        | "candidateTargets"
        | "missingEvidence"
        | "rejectedEvidence"
        | "unverifiedEvidence"
      >
    >);
const rtTargetCache = createVerifiedTargetCache<ResolvedRtTarget>(
  "dp:rotten-targets:v2"
);

const getCachedRtTarget = rtTargetCache.get;
const cacheRtTarget = rtTargetCache.set;
const invalidateRtTarget = rtTargetCache.invalidate;

const mapFailure = (
  mapping: Extract<RottenMapping, { status: "unavailable" }>
): TargetFailure => {
  const { reason } = mapping;
  if (reason === "conflict") {
    return "identity-conflict";
  }
  if (reason === "season") {
    return "season-unmatched";
  }
  if (reason === "error") {
    return mapping.failure ?? "error";
  }
  return "missing-mapping";
};

const mappedTarget = (
  mapping: Extract<RottenMapping, { status: "matched" }>
): ResolvedRtTarget => ({
  identityImdbIds: mapping.identityImdbIds ?? [],
  identityPersonIds: mapping.identityPersonIds ?? [],
  rtId: mapping.rtId,
  seriesRtId: mapping.seriesRtId,
});

const validateMappedSeriesPage = async (
  context: ResolutionContext,
  mapping: Extract<RottenMapping, { status: "matched" }>,
  seriesPage: { html: string; rtId: string; url: string },
  signal: AbortSignal
): Promise<TargetFailure | null> => {
  const page = readStructuredPage(seriesPage.html);
  if (!page.canonicalUrl || page.jsonLd.length === 0) {
    return "identity-unavailable";
  }
  if (!structuredPageTypes(page).has("TVSeries")) {
    return "identity-conflict";
  }
  if (!isRtSeriesPage(seriesPage.html, seriesPage.url)) {
    return "identity-unavailable";
  }
  if (seriesPage.rtId === mapping.rtId) {
    return null;
  }
  const evidence = contextIdentityEvidence(context);
  if (!evidence) {
    return "identity-conflict";
  }
  let identityProof: Awaited<ReturnType<typeof verifiesRtAlias>>;
  try {
    identityProof = await verifiesRtAlias(
      {
        evidence,
        expectedStableIds: mapping.identityImdbIds ?? [],
        html: seriesPage.html,
        imdbId: context.imdbId,
        kind: "series",
        personIds: mapping.identityPersonIds ?? [],
      },
      signal
    );
  } catch {
    return signal.aborted ? "aborted" : "identity-unavailable";
  }
  if (signal.aborted) {
    return "aborted";
  }
  if (identityProof === "matched") {
    return null;
  }
  return identityProof === "unavailable"
    ? "identity-unavailable"
    : "identity-conflict";
};

const resolveSeasonLink = async (
  context: ResolutionContext,
  mapping: Extract<RottenMapping, { status: "matched" }>,
  signal: AbortSignal
): Promise<RtTargetResult> => {
  let seriesPage: Awaited<ReturnType<typeof requestRtPage>>;
  try {
    seriesPage = await requestRtPage(mapping.rtId, signal);
  } catch {
    return signal.aborted
      ? { failure: "aborted" }
      : { failure: "identity-unavailable" };
  }
  if (signal.aborted) {
    return { failure: "aborted" };
  }
  const failure = await validateMappedSeriesPage(
    context,
    mapping,
    seriesPage,
    signal
  );
  if (failure) {
    return { failure };
  }
  if (context.season === null) {
    return { failure: "season-unmatched" };
  }
  const seasonPath = findSeasonPath(
    seriesPage.html,
    seriesPage.rtId,
    context.season
  );
  return seasonPath
    ? {
        ...mappedTarget(mapping),
        rtId: seasonPath,
        seriesRtId: seriesPage.rtId,
      }
    : { failure: "season-unmatched" };
};

const resolveRtTarget = async (
  context: ResolutionContext,
  signal: AbortSignal,
  refresh = false
): Promise<RtTargetResult> => {
  if (!context.subjectId) {
    return { failure: "missing-mapping" };
  }
  if (context.seasonConflict || context.unsupportedEpisode) {
    return { failure: "season-unmatched" };
  }
  if (!refresh) {
    const cached = getCachedRtTarget(context);
    if (cached?.status === "resolved") {
      return cached.target;
    }
  }

  const mapping = await resolveRottenMapping(context, signal);
  if (signal.aborted) {
    return { failure: "aborted" };
  }
  if (mapping.status === "unavailable") {
    return {
      failure: mapFailure(mapping),
      acceptedEvidence: mapping.acceptedEvidence ?? [],
      candidateTargets: mapping.candidateTargets ?? [],
      missingEvidence: mapping.missingEvidence ?? [],
      rejectedEvidence: mapping.rejectedEvidence ?? [],
      unverifiedEvidence: mapping.unverifiedEvidence ?? [],
    };
  }
  return mapping.needsSeasonLink
    ? resolveSeasonLink(context, mapping, signal)
    : mappedTarget(mapping);
};

export {
  cacheRtTarget,
  getCachedRtTarget,
  invalidateRtTarget,
  resolveRtTarget,
  type TargetFailure,
  type ResolvedRtTarget,
  type RtTargetResult,
};
