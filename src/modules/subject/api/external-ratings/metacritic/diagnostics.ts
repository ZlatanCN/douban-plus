import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import { createExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";

type OnMcOutcome = (diagnostic: ExternalRatingDiagnostic) => void;

const makeDiagnostic = (
  reason: ExternalRatingReason,
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

const failureReasonFromError = (error: unknown): ExternalRatingReason => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "cancelled";
  }
  if (error instanceof SyntaxError) {
    return "parse-error";
  }
  return "request-error";
};

const failureDiagnostic = (
  error: unknown,
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  errorCode: string
): ExternalRatingDiagnostic => ({
  ...makeDiagnostic(
    failureReasonFromError(error),
    stage,
    target,
    null,
    errorCode
  ),
});

export { failureDiagnostic, makeDiagnostic };
export type { OnMcOutcome };
