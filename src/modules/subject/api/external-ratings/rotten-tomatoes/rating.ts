import type { RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { validateRtPage } from "./alias";
import { requestRtPage } from "./page";
import { makeDiagnostic, ratingFailure } from "./rating-outcome";
import type { OnRtResolution, RtResolution } from "./rating-outcome";
import { invalidateRequests, isCurrent } from "./request-revision";
import { parseScorecard } from "./scorecard";
import { removeSnapshot, writeSnapshot } from "./snapshot";
import { invalidateRtTarget } from "./target";
import type { ResolvedRtTarget } from "./target";

const currentFailure = (
  context: ResolutionContext,
  revision: number,
  signal: AbortSignal
): RtResolution | null => {
  if (signal.aborted) {
    return ratingFailure("aborted");
  }
  return isCurrent(context, revision)
    ? null
    : ratingFailure("identity-conflict");
};

const confirmedIdentityConflict = (
  context: ResolutionContext,
  object: RtRating["object"],
  prior: RtRating | null,
  onResult?: OnRtResolution
): RtResolution => {
  invalidateRequests(context);
  invalidateRtTarget(context);
  removeSnapshot(prior?.object ?? object);
  const result = ratingFailure("identity-conflict");
  onResult?.(result);
  return result;
};

const identityResultFailure = (
  context: ResolutionContext,
  revision: number,
  object: RtRating["object"],
  prior: RtRating | null,
  identity: Awaited<ReturnType<typeof validateRtPage>>,
  signal: AbortSignal,
  onResult?: OnRtResolution
): RtResolution | null => {
  const requestFailure = currentFailure(context, revision, signal);
  if (requestFailure) {
    return requestFailure;
  }
  if (identity.status === "matched") {
    return null;
  }
  if (identity.status === "identity-unavailable") {
    const result: RtResolution = prior
      ? {
          diagnostic: makeDiagnostic(
            "request-error",
            "identity",
            object.rtId,
            "identity-unavailable"
          ),
          rating: prior,
          status: "stale",
        }
      : ratingFailure(
          "identity-unavailable",
          null,
          makeDiagnostic(
            "request-error",
            "identity",
            object.rtId,
            "identity-unavailable"
          )
        );
    onResult?.(result);
    return result;
  }
  if (identity.status === "identity-conflict") {
    return confirmedIdentityConflict(context, object, prior, onResult);
  }
  return ratingFailure("aborted");
};

const loadRating = async (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  object: RtRating["object"],
  prior: RtRating | null,
  signal: AbortSignal,
  revision: number,
  onResult?: OnRtResolution
): Promise<RtResolution> => {
  const startedFailure = currentFailure(context, revision, signal);
  if (startedFailure) {
    return startedFailure;
  }
  if (prior && !prior.stale) {
    const result = { rating: prior, status: "cached" } satisfies RtResolution;
    onResult?.(result);
    return result;
  }
  if (prior) {
    onResult?.({ rating: prior, status: "stale" });
  }

  const page = await requestRtPage(target.rtId, signal);
  const pageFailure = currentFailure(context, revision, signal);
  if (pageFailure) {
    return pageFailure;
  }
  const identity = await validateRtPage({ context, page, target }, signal);
  const identityFailure = identityResultFailure(
    context,
    revision,
    object,
    prior,
    identity,
    signal,
    onResult
  );
  if (identityFailure) {
    return identityFailure;
  }
  if (identity.status !== "matched") {
    return ratingFailure("identity-conflict");
  }
  const parsed = parseScorecard(page.html, {
    fetchedAt: Date.now(),
    kind: context.kind,
    pageRtId: page.rtId,
    rtId: target.rtId,
    season: context.season,
    seriesRtId: identity.seriesRtId ?? target.seriesRtId,
    subjectId: context.subjectId,
    url: page.url,
  });
  if (parsed.status === "invalid-page") {
    const diagnostic = makeDiagnostic(
      "parse-error",
      "parse",
      target.rtId,
      "invalid-scorecard"
    );
    return prior
      ? { diagnostic, rating: prior, status: "stale" }
      : ratingFailure("error", null, diagnostic);
  }
  if (parsed.status === "identity-conflict") {
    return confirmedIdentityConflict(context, object, prior, onResult);
  }
  if (parsed.status === "no-rating") {
    removeSnapshot(object);
    return ratingFailure(
      "no-rating",
      null,
      makeDiagnostic("source-no-rating", "parse", target.rtId)
    );
  }
  if (!isCurrent(context, revision)) {
    return ratingFailure("identity-conflict");
  }
  writeSnapshot(parsed.rating);
  return { rating: parsed.rating, status: "refreshed" };
};

export { loadRating };
export type { OnRtResolution, RtResolution };
