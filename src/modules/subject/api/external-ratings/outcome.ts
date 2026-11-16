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

type ExternalRatingDiagnostic = {
  cacheAgeMs: number | null;
  errorCode: string | null;
  reason: ExternalRatingReason;
  stage: ExternalRatingStage;
  target: string | null;
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
};
