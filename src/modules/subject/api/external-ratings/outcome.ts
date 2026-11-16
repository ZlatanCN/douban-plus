type ExternalRatingReason =
  | "cancelled"
  | "identity-conflict"
  | "mapping-missing"
  | "parse-error"
  | "rating"
  | "request-error"
  | "source-no-rating";

type ExternalRatingStage =
  | "cache"
  | "identity"
  | "mapping"
  | "parse"
  | "rating"
  | "request";

type RatingEvidenceCategory =
  | "aggregate-rating"
  | "canonical"
  | "creator"
  | "exact-id"
  | "season-link"
  | "season-number"
  | "title"
  | "type"
  | "year";

type ExternalRatingDiagnostic = {
  acceptedEvidence: RatingEvidenceCategory[];
  cacheAgeMs: number | null;
  candidateTargets: string[];
  errorCode: string | null;
  missingEvidence: RatingEvidenceCategory[];
  reason: ExternalRatingReason;
  rejectedEvidence: RatingEvidenceCategory[];
  stage: ExternalRatingStage;
  target: string | null;
  unverifiedEvidence: RatingEvidenceCategory[];
};

type ExternalRatingOutcome<T> = {
  diagnostic: ExternalRatingDiagnostic;
  rating: T | null;
};

export type {
  ExternalRatingDiagnostic,
  ExternalRatingOutcome,
  ExternalRatingReason,
  ExternalRatingStage,
  RatingEvidenceCategory,
};

type ExternalRatingDiagnosticInput = Omit<
  ExternalRatingDiagnostic,
  | "acceptedEvidence"
  | "candidateTargets"
  | "missingEvidence"
  | "rejectedEvidence"
  | "unverifiedEvidence"
> & {
  acceptedEvidence?: RatingEvidenceCategory[];
  candidateTargets?: string[];
  missingEvidence?: RatingEvidenceCategory[];
  rejectedEvidence?: RatingEvidenceCategory[];
  unverifiedEvidence?: RatingEvidenceCategory[];
};

const createExternalRatingDiagnostic = (
  input: ExternalRatingDiagnosticInput
): ExternalRatingDiagnostic => {
  const acceptedEvidence = [...new Set(input.acceptedEvidence)].slice(0, 8);
  const candidateTargets = [...new Set(input.candidateTargets)].slice(0, 4);
  const missingEvidence = [...new Set(input.missingEvidence)].slice(0, 8);
  const rejectedEvidence = [...new Set(input.rejectedEvidence)].slice(0, 8);
  const unverifiedEvidence = [...new Set(input.unverifiedEvidence)]
    .filter(
      (category) =>
        !acceptedEvidence.includes(category) &&
        !missingEvidence.includes(category)
    )
    .slice(0, 8);
  return {
    ...input,
    acceptedEvidence,
    candidateTargets,
    missingEvidence,
    rejectedEvidence,
    unverifiedEvidence,
  };
};

export { createExternalRatingDiagnostic };
