import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import { createExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { readSnapshot, readUniqueSnapshot } from "./snapshot";

type RtResolution = {
  diagnostic?: ExternalRatingDiagnostic;
  rating: RtRating | null;
  status:
    | "aborted"
    | "cached"
    | "error"
    | "identity-conflict"
    | "identity-unavailable"
    | "missing-mapping"
    | "no-rating"
    | "refreshed"
    | "season-unmatched"
    | "stale";
};

type OnRtResolution = (result: RtResolution) => void;

const ratingFailure = (
  status: RtResolution["status"],
  rating: RtRating | null = null,
  diagnostic?: ExternalRatingDiagnostic
): RtResolution => ({
  ...(diagnostic ? { diagnostic } : {}),
  rating,
  status,
});

const makeDiagnostic = (
  reason: ExternalRatingReason,
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  errorCode: string | null = null,
  fetchedAt: number | null = null
): ExternalRatingDiagnostic =>
  createExternalRatingDiagnostic({
    cacheAgeMs: fetchedAt === null ? null : Math.max(0, Date.now() - fetchedAt),
    errorCode,
    reason,
    stage,
    target,
  });

const getSnapshotObject = (
  context: ResolutionContext,
  rtId: string
): RtRating["object"] => ({
  kind: context.kind,
  rtId,
  subjectId: context.subjectId,
});

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

const isConfirmedRatingStatus = (status: RtResolution["status"]): boolean =>
  status === "cached" ||
  status === "no-rating" ||
  status === "refreshed" ||
  status === "stale";

export {
  fallbackSnapshot,
  getSnapshotObject,
  isConfirmedRatingStatus,
  makeDiagnostic,
  ratingFailure,
};
export type { OnRtResolution, RtResolution };
