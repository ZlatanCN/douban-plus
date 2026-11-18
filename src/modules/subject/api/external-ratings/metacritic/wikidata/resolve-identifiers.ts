import type { TargetResult, MetacriticTarget } from "./claims";
import type {
  IdentifierResult,
  MetacriticTargetResolution,
  ResolutionEvidence,
} from "./types";

const resolveTargetResults = (
  targets: TargetResult[],
  evidence: ResolutionEvidence,
  hasRejectedLookup: boolean,
  failure: "parse-error" | "request-error"
): MetacriticTargetResolution => {
  const matches = targets.filter(
    (target): target is MetacriticTarget => target.status === "matched"
  );
  const seasonLinks = targets.filter(
    (
      target
    ): target is Extract<TargetResult, { status: "season-link-needed" }> =>
      target.status === "season-link-needed"
  );
  const uniqueTargets = new Map(
    matches.map((target) => [
      `${target.kind}:${target.metacriticId}:${target.seriesId ?? ""}:${target.seriesMetacriticId ?? ""}`,
      target,
    ])
  );
  const uniqueSeasonLinks = new Map(
    seasonLinks.map((result) => [
      `${result.season}:${result.seriesTarget.seriesId ?? ""}:${result.seriesTarget.metacriticId}`,
      result,
    ])
  );
  if (uniqueTargets.size > 1 || uniqueSeasonLinks.size > 1) {
    return { complete: true, status: "identity-conflict", ...evidence };
  }
  const [matchedTarget] = uniqueTargets.values();
  const [seasonLink] = uniqueSeasonLinks.values();
  if (matchedTarget && seasonLink) {
    if (
      matchedTarget.kind !== "season" ||
      matchedTarget.season !== seasonLink.season ||
      matchedTarget.seriesId !== seasonLink.seriesTarget.seriesId
    ) {
      return { complete: true, status: "identity-conflict", ...evidence };
    }
    return {
      complete: !hasRejectedLookup,
      ...(hasRejectedLookup ? { failure } : {}),
      status: "matched",
      target: matchedTarget,
      ...evidence,
    };
  }
  if (seasonLink) {
    return {
      complete: !hasRejectedLookup,
      ...(hasRejectedLookup ? { failure } : {}),
      ...seasonLink,
      ...evidence,
    };
  }
  if (matchedTarget) {
    return {
      complete: !hasRejectedLookup,
      ...(hasRejectedLookup ? { failure } : {}),
      status: "matched",
      target: matchedTarget,
      ...evidence,
    };
  }
  return {
    complete: !hasRejectedLookup,
    ...(hasRejectedLookup ? { failure } : {}),
    status: hasRejectedLookup ? "error" : "missing",
    ...evidence,
  };
};

const resolveIdentifierResults = (
  results: PromiseSettledResult<IdentifierResult>[]
): MetacriticTargetResolution => {
  const hasRejectedLookup = results.some(
    (result) => result.status === "rejected"
  );
  const rejectedReason = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  )?.reason;
  const failure =
    rejectedReason instanceof SyntaxError ? "parse-error" : "request-error";
  const completed = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );
  const targets = completed.map(({ target }) => target);
  if (targets.some((target) => target.status === "ambiguous")) {
    return {
      complete: true,
      status: "ambiguous",
      ...aggregateEvidence(completed),
    };
  }
  const hasResolvedTarget =
    !hasRejectedLookup &&
    targets.some(
      (target) =>
        target.status === "matched" || target.status === "season-link-needed"
    );
  const evidence = aggregateEvidence(completed, hasResolvedTarget);
  return resolveTargetResults(targets, evidence, hasRejectedLookup, failure);
};

const aggregateEvidence = (
  completed: IdentifierResult[],
  hasResolvedTarget = false
): ResolutionEvidence => ({
  acceptedEvidence: completed.flatMap(
    ({ evidence: item }) => item.acceptedEvidence
  ),
  candidateTargets: [
    ...new Set(
      completed.flatMap(({ evidence: item }) => item.candidateTargets)
    ),
  ],
  missingEvidence: hasResolvedTarget
    ? []
    : completed.flatMap(({ evidence: item }) => item.missingEvidence),
  rejectedEvidence: completed.flatMap(
    ({ evidence: item }) => item.rejectedEvidence
  ),
  unverifiedEvidence: hasResolvedTarget
    ? []
    : completed.flatMap(({ evidence: item }) => item.unverifiedEvidence),
});

export { resolveIdentifierResults };
