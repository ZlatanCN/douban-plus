import type { FetchImdbResult } from "@/modules/subject/api/external-ratings/imdb";
import { createExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { McRating, RtRating } from "@/modules/subject/domain";

import type { ResolutionContext } from "./types";

const makeDiagnostic = (
  reason: ExternalRatingDiagnostic["reason"],
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  fetchedAt: number | null = null,
  errorCode: string | null = null
): ExternalRatingDiagnostic =>
  createExternalRatingDiagnostic({
    cacheAgeMs: fetchedAt === null ? null : Math.max(0, Date.now() - fetchedAt),
    errorCode,
    reason,
    stage,
    target,
  });

const imdbDiagnostic = (
  result: FetchImdbResult | null,
  context: ResolutionContext
): ExternalRatingDiagnostic => {
  if (!context.imdbId) {
    return makeDiagnostic(
      "mapping-missing",
      "mapping",
      null,
      null,
      "no-imdb-id"
    );
  }
  if (result?.rating) {
    return makeDiagnostic("rating", "rating", context.imdbId);
  }
  return result?.sourceUrl
    ? makeDiagnostic("source-no-rating", "rating", context.imdbId)
    : makeDiagnostic(
        "request-error",
        "request",
        context.imdbId,
        null,
        "imdb-fetch"
      );
};

const metacriticDiagnostic = (
  rating: McRating | null,
  context: ResolutionContext
): ExternalRatingDiagnostic => {
  if (rating) {
    return makeDiagnostic(
      "rating",
      rating.stale ? "cache" : "rating",
      rating.object.metacriticId,
      rating.fetchedAt
    );
  }
  if (
    !context.subjectId ||
    context.seasonConflict ||
    context.unsupportedEpisode ||
    (context.kind === "season" && context.season === null)
  ) {
    return makeDiagnostic(
      "mapping-missing",
      "mapping",
      null,
      null,
      "no-target"
    );
  }
  return makeDiagnostic(
    "request-error",
    "request",
    null,
    null,
    "mc-unresolved"
  );
};

const rtDiagnostic = (result: RtResolutionLike): ExternalRatingDiagnostic => {
  if (result.diagnostic) {
    return result.diagnostic;
  }
  if (result.rating) {
    return makeDiagnostic(
      "rating",
      result.status === "cached" || result.status === "stale"
        ? "cache"
        : "rating",
      result.rating.object.rtId,
      result.rating.fetchedAt
    );
  }
  switch (result.status) {
    case "aborted": {
      return makeDiagnostic("cancelled", "request", null, null, "aborted");
    }
    case "identity-conflict": {
      return makeDiagnostic(
        "identity-conflict",
        "identity",
        null,
        null,
        "rt-conflict"
      );
    }
    case "missing-mapping":
    case "season-unmatched": {
      return makeDiagnostic(
        "mapping-missing",
        "mapping",
        null,
        null,
        result.status
      );
    }
    case "no-rating": {
      return makeDiagnostic(
        "source-no-rating",
        "parse",
        null,
        null,
        "no-rating"
      );
    }
    case "error":
    case "identity-unavailable": {
      return makeDiagnostic(
        "request-error",
        "request",
        null,
        null,
        result.status
      );
    }
    case "cached":
    case "refreshed":
    case "stale": {
      return makeDiagnostic(
        "source-no-rating",
        "parse",
        null,
        null,
        "missing-result"
      );
    }
    default: {
      return makeDiagnostic(
        "request-error",
        "request",
        null,
        null,
        "rt-unresolved"
      );
    }
  }
};

type DiagnosticSource = "imdb" | "mc" | "rt";
type RtResolutionLike = {
  diagnostic?: ExternalRatingDiagnostic;
  rating: RtRating | null;
  status: string;
};

const contextCandidates = (context: ResolutionContext): string[] =>
  [context.imdbId, context.subjectId].filter(
    (target): target is string => target !== null
  );

const addDiagnosticEvidence = (
  diagnostic: ExternalRatingDiagnostic,
  source: DiagnosticSource,
  context: ResolutionContext
): ExternalRatingDiagnostic => {
  const accepted = [...diagnostic.acceptedEvidence];
  const rejected = [...diagnostic.rejectedEvidence];
  const missing = [...diagnostic.missingEvidence];
  const unverified = [...diagnostic.unverifiedEvidence];
  if (diagnostic.reason === "rating") {
    accepted.push("exact-id");
    if (source !== "imdb") {
      accepted.push("type", "canonical");
      if (context.kind === "season") {
        accepted.push("season-number");
      }
    }
  } else if (diagnostic.reason === "source-no-rating") {
    accepted.push("exact-id");
    if (source !== "imdb") {
      accepted.push("type", "canonical");
      missing.push("aggregate-rating");
      if (context.kind === "season") {
        accepted.push("season-number");
      }
    }
  } else if (diagnostic.reason === "mapping-missing") {
    missing.push("exact-id");
    unverified.push("type", "canonical", "aggregate-rating");
    if (context.kind === "season") {
      unverified.push("season-link", "season-number");
    }
  } else if (diagnostic.reason === "identity-conflict") {
    rejected.push("exact-id");
    unverified.push("aggregate-rating");
  } else if (diagnostic.reason === "parse-error") {
    accepted.push("exact-id", "type");
    unverified.push("canonical", "aggregate-rating");
  } else {
    unverified.push("exact-id", "type", "canonical", "aggregate-rating");
  }
  return createExternalRatingDiagnostic({
    ...diagnostic,
    acceptedEvidence: accepted,
    candidateTargets: [
      ...(diagnostic.target ? [diagnostic.target] : []),
      ...diagnostic.candidateTargets,
      ...contextCandidates(context),
    ],
    missingEvidence: missing,
    rejectedEvidence: rejected,
    unverifiedEvidence: unverified,
  });
};

export {
  addDiagnosticEvidence,
  imdbDiagnostic,
  makeDiagnostic,
  metacriticDiagnostic,
  rtDiagnostic,
};
