import { describe, expect, it } from "vitest";

import type {
  RatingDiagnosticPage,
  RatingDiagnosticRecord,
} from "@/modules/subject/runtime/rating-diagnostics";
import {
  createRatingDiagnosticsReportText,
  sanitizeRatingDiagnosticRecord,
} from "@/modules/subject/runtime/rating-diagnostics-report";

const page: RatingDiagnosticPage = {
  imdbId: "tt36786185",
  kind: "series",
  season: null,
  subjectId: "1000000001",
};

describe("rating diagnostics report", () => {
  it("copies only bounded diagnostic fields and excludes unknown payload data", () => {
    const record = {
      acceptedEvidence: ["exact-id", "canonical"],
      cacheAgeMs: null,
      candidateTargets: [
        "Q135470331",
        "tv/the-altruists",
        "https://example.test/?cookie=do-not-copy-this-page",
      ],
      errorCode: null,
      hasRating: false,
      missingEvidence: ["aggregate-rating"],
      reason: "source-no-rating",
      rejectedEvidence: [],
      source: "mc",
      stage: "parse",
      target: "tv/the-altruists",
      unverifiedEvidence: [],
      authorization: "do-not-copy-this-page",
      rawPage: "<html>do-not-copy-this-page</html>",
    } as RatingDiagnosticRecord;
    const safeRecord = sanitizeRatingDiagnosticRecord(record);
    const text = createRatingDiagnosticsReportText(page, [safeRecord]);

    expect(Object.keys(safeRecord).toSorted()).toStrictEqual([
      "acceptedEvidence",
      "cacheAgeMs",
      "candidateTargets",
      "errorCode",
      "hasRating",
      "missingEvidence",
      "reason",
      "rejectedEvidence",
      "source",
      "stage",
      "target",
      "unverifiedEvidence",
    ]);
    expect(safeRecord.candidateTargets).toStrictEqual([
      "Q135470331",
      "tv/the-altruists",
    ]);
    expect(safeRecord.candidateTargets.length).toBeLessThanOrEqual(4);
    expect(text).not.toContain("do-not-copy-this-page");
    expect(text).not.toContain("authorization");
  });
});
