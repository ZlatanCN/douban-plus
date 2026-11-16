import type { RatingEvidenceCategory } from "@/modules/subject/api/external-ratings/outcome";

import packageJson from "../../../../package.json";
import type {
  RatingDiagnosticPage,
  RatingDiagnosticRecord,
} from "./rating-diagnostics";

const EVIDENCE_CATEGORIES = new Set<RatingEvidenceCategory>([
  "aggregate-rating",
  "canonical",
  "creator",
  "exact-id",
  "season-link",
  "season-number",
  "title",
  "type",
  "year",
]);

const safeErrorCode = (value: string | null): string | null =>
  value !== null && /^[a-z0-9-]{1,64}$/u.test(value) ? value : null;

const safeTarget = (value: string | null): string | null =>
  value !== null &&
  /^[a-z0-9][a-z0-9._/-]{0,119}$/iu.test(value) &&
  !value.split("/").includes("..")
    ? value
    : null;

const safeCandidateTargets = (values: string[]): string[] =>
  [
    ...new Set(
      values.map(safeTarget).filter((value): value is string => value !== null)
    ),
  ].slice(0, 4);

const safeEvidence = (
  values: RatingEvidenceCategory[]
): RatingEvidenceCategory[] =>
  [...new Set(values.filter((value) => EVIDENCE_CATEGORIES.has(value)))].slice(
    0,
    8
  );

const sanitizeRatingDiagnosticRecord = (
  record: RatingDiagnosticRecord
): RatingDiagnosticRecord => ({
  acceptedEvidence: safeEvidence(record.acceptedEvidence),
  cacheAgeMs:
    record.cacheAgeMs !== null &&
    Number.isFinite(record.cacheAgeMs) &&
    record.cacheAgeMs >= 0
      ? record.cacheAgeMs
      : null,
  candidateTargets: safeCandidateTargets(record.candidateTargets),
  errorCode: safeErrorCode(record.errorCode),
  hasRating: record.hasRating === true,
  missingEvidence: safeEvidence(record.missingEvidence),
  reason: record.reason,
  rejectedEvidence: safeEvidence(record.rejectedEvidence),
  source: record.source,
  stage: record.stage,
  target: safeTarget(record.target),
  unverifiedEvidence: safeEvidence(record.unverifiedEvidence),
});

const reportWork = (page: RatingDiagnosticPage | null) => {
  if (page === null) {
    return null;
  }
  const { imdbId: pageImdbId, kind, season: pageSeason, subjectId } = page;
  let imdbId: string | null = null;
  let season: number | null = null;
  if (pageImdbId !== null && /^tt\d{5,16}$/u.test(pageImdbId)) {
    imdbId = pageImdbId;
  }
  if (
    pageSeason !== null &&
    Number.isSafeInteger(pageSeason) &&
    pageSeason > 0
  ) {
    season = pageSeason;
  }
  return {
    imdbId,
    kind,
    season,
    subjectId: /^\d{1,32}$/u.test(subjectId) ? subjectId : null,
  };
};

const createRatingDiagnosticsReportText = (
  page: RatingDiagnosticPage | null,
  records: RatingDiagnosticRecord[]
): string =>
  JSON.stringify(
    {
      scriptVersion: packageJson.version,
      work: reportWork(page),
      records: (["imdb", "mc", "rt"] as const)
        .map((source) => records.find((record) => record.source === source))
        .filter(
          (record): record is RatingDiagnosticRecord => record !== undefined
        ),
    },
    null,
    2
  );

const showSelectableReport = (text: string): void => {
  const { body } = document;
  if (!body) {
    return;
  }
  body.querySelector("#dp-rating-diagnostics-copy")?.remove();
  const panel = document.createElement("section");
  panel.id = "dp-rating-diagnostics-copy";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "评分诊断报告");
  Object.assign(panel.style, {
    background: "#fff",
    border: "1px solid #777",
    borderRadius: "8px",
    boxShadow: "0 8px 32px #0005",
    color: "#111",
    inset: "auto 16px 16px auto",
    maxWidth: "min(680px, calc(100vw - 32px))",
    padding: "12px",
    position: "fixed",
    zIndex: "2147483647",
  });

  const label = document.createElement("label");
  label.htmlFor = "dp-rating-diagnostics-copy-text";
  label.textContent = "剪贴板不可用。请复制以下本页评分诊断报告。";
  const textarea = document.createElement("textarea");
  textarea.id = label.htmlFor;
  textarea.readOnly = true;
  textarea.rows = 14;
  textarea.value = text;
  textarea.setAttribute("aria-label", "可复制的本页评分诊断报告");
  Object.assign(textarea.style, {
    display: "block",
    fontFamily: "monospace",
    marginBlock: "8px",
    width: "min(640px, calc(100vw - 64px))",
  });
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "关闭";
  close.addEventListener("click", () => panel.remove());
  panel.append(label, textarea, close);
  body.append(panel);
  textarea.focus();
  textarea.select();
};

export {
  createRatingDiagnosticsReportText,
  sanitizeRatingDiagnosticRecord,
  showSelectableReport,
};
