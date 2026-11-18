import type { ExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { failureDiagnostic, makeDiagnostic } from "./diagnostics";
import type { OnMcOutcome } from "./diagnostics";
import {
  invalidateRatingTarget,
  sameTarget,
  targetObject,
} from "./rating-state";
import { finishSeasonLinkResolution } from "./target-resolution";
import type { MetacriticTarget } from "./wikidata/claims";
import {
  cacheMetacriticTarget,
  resolveMetacriticTargetFresh,
} from "./wikidata/resolve";
import type { MetacriticTargetResolution } from "./wikidata/resolve";

const cachedTargetFailureDiagnostic = (
  resolution: MetacriticTargetResolution,
  signal: AbortSignal,
  target: string
): ExternalRatingDiagnostic => {
  if (signal.aborted) {
    return makeDiagnostic("cancelled", "mapping", target, null, "aborted");
  }
  if (resolution.status === "ambiguous" || resolution.status === "missing") {
    return makeDiagnostic(
      "mapping-missing",
      "mapping",
      target,
      null,
      "mc-mapping-missing"
    );
  }
  return makeDiagnostic(
    resolution.failure ?? "request-error",
    "mapping",
    target,
    null,
    "mc-revalidate"
  );
};

const revalidateCachedTarget = async (
  context: ResolutionContext,
  cachedTarget: MetacriticTarget,
  signal: AbortSignal,
  onOutcome?: OnMcOutcome
): Promise<MetacriticTarget | null> => {
  let resolution: MetacriticTargetResolution;
  try {
    resolution = await finishSeasonLinkResolution(
      context,
      await resolveMetacriticTargetFresh(context, signal),
      signal
    );
  } catch (error) {
    onOutcome?.(
      failureDiagnostic(
        error,
        "mapping",
        cachedTarget.metacriticId,
        "mc-revalidate"
      )
    );
    return cachedTarget;
  }
  if (
    !resolution.complete ||
    signal.aborted ||
    resolution.status === "error" ||
    resolution.status === "ambiguous" ||
    resolution.status === "missing"
  ) {
    onOutcome?.(
      cachedTargetFailureDiagnostic(
        resolution,
        signal,
        cachedTarget.metacriticId
      )
    );
    return cachedTarget;
  }
  if (
    resolution.status === "matched" &&
    sameTarget(resolution.target, cachedTarget)
  ) {
    cacheMetacriticTarget(context, cachedTarget);
    return cachedTarget;
  }
  const priorObject = targetObject(context, cachedTarget);
  if (resolution.status === "identity-conflict") {
    onOutcome?.(
      makeDiagnostic(
        "identity-conflict",
        "identity",
        cachedTarget.metacriticId,
        null,
        "mc-conflict"
      )
    );
    invalidateRatingTarget(context, priorObject);
    return null;
  }
  invalidateRatingTarget(context, priorObject);
  onOutcome?.(
    makeDiagnostic(
      "mapping-missing",
      "mapping",
      cachedTarget.metacriticId,
      null,
      "mc-target-changed"
    )
  );
  return resolution.status === "matched" ? resolution.target : null;
};

export { revalidateCachedTarget };
