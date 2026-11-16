import type { RatingEvidenceCategory } from "@/modules/subject/api/external-ratings/outcome";

import type { MetacriticTarget, TargetResult } from "./claims";

type ResolutionEvidence = {
  acceptedEvidence: RatingEvidenceCategory[];
  candidateTargets: string[];
  missingEvidence: RatingEvidenceCategory[];
  rejectedEvidence: RatingEvidenceCategory[];
  unverifiedEvidence: RatingEvidenceCategory[];
};

type IdentifierResult = {
  evidence: ResolutionEvidence;
  target: TargetResult;
};

type MetacriticTargetResolution = (
  | {
      complete: boolean;
      failure?: "parse-error" | "request-error";
      season: number;
      seriesTarget: MetacriticTarget;
      status: "season-link-needed";
    }
  | {
      complete: boolean;
      failure?: "parse-error" | "request-error";
      status: "ambiguous" | "error" | "identity-conflict" | "missing";
    }
  | {
      complete: boolean;
      failure?: "parse-error" | "request-error";
      status: "matched";
      target: MetacriticTarget;
    }
) &
  Partial<ResolutionEvidence>;

export type {
  IdentifierResult,
  MetacriticTargetResolution,
  ResolutionEvidence,
};
