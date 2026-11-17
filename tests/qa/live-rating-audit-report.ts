import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type sampleManifest from "../fixtures/external-ratings/v1/manifest.json";
import { classifyDiagnostic } from "./live-rating-audit-classification";
import type {
  AuditRow,
  DiagnosticRecord,
  NetworkObservation,
  Source,
} from "./live-rating-audit-types";

const sourceUrl = (
  sample: (typeof sampleManifest.samples)[number],
  source: Source
): string => {
  if (source === "imdb") {
    return `https://www.imdb.com/title/${sample.work.imdbId}/`;
  }
  if (source === "mc") {
    return sample.sources.metacritic.url;
  }
  return sample.sources.rottenTomatoes.url;
};

const historicalExpected = (
  sample: (typeof sampleManifest.samples)[number],
  source: Source
): string => {
  if (source === "imdb") {
    return "not pinned in this sample set";
  }
  const expected =
    sample.expected[source === "mc" ? "metacritic" : "rottenTomatoes"];
  return expected.outcome;
};

const rowsFromDiagnostics = (
  sample: (typeof sampleManifest.samples)[number],
  checkedAt: string,
  records: DiagnosticRecord[],
  observations: NetworkObservation[],
  visibleRatings: Record<Source, boolean>
): AuditRow[] =>
  (["imdb", "mc", "rt"] as const).map((source) => {
    const record = records.find((candidate) => candidate.source === source);
    return {
      checkedAt,
      errorCode: record?.errorCode ?? null,
      expectedGranularity: sample.work.granularity,
      historicalExpected: historicalExpected(sample, source),
      reason: record?.reason ?? "diagnostic-unavailable",
      sampleId: sample.id,
      source,
      sourceUrl: sourceUrl(sample, source),
      stage: record?.stage ?? "unverified",
      status: classifyDiagnostic(record, observations, visibleRatings[source]),
      target: record?.target ?? null,
    };
  });

const unverifiedRows = (
  sample: (typeof sampleManifest.samples)[number],
  checkedAt: string,
  reason: string,
  stage: string
): AuditRow[] =>
  (["imdb", "mc", "rt"] as const).map((source) => ({
    checkedAt,
    errorCode: null,
    expectedGranularity: sample.work.granularity,
    historicalExpected: historicalExpected(sample, source),
    reason,
    sampleId: sample.id,
    source,
    sourceUrl: sourceUrl(sample, source),
    stage,
    status: "unverified",
    target: null,
  }));

const renderAuditReport = (rows: AuditRow[]): string => {
  const lines = [
    "# Live rating audit",
    "",
    "This report checks current source reachability and parsing through SubjectPageRuntime. Fixed fixture outcomes remain historical evidence; live values are not compared with the captured score numbers.",
    "",
    "| Checked at (UTC) | Sample | Granularity | Source | Status | Current outcome | Stage | Error | Target | Historical expectation |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.checkedAt} | ${row.sampleId} | ${row.expectedGranularity} | ${row.source} | **${row.status}** | ${row.reason} | ${row.stage} | ${row.errorCode ?? "—"} | ${row.target ?? "—"} | ${row.historicalExpected} |`
    );
  }
  lines.push(
    "",
    "`request-error`, cancellation, blocked Douban extraction, and missing outcomes are unverified. They are never reported as passes or as source-no-rating.",
    ""
  );
  return lines.join("\n");
};

const writeAuditReport = async (rows: AuditRow[]): Promise<string> => {
  const reportPath = path.resolve(
    process.env.DP_RATING_AUDIT_OUTPUT ?? "artifacts/live-rating-audit.md"
  );
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, renderAuditReport(rows), "utf-8");
  return reportPath;
};

export {
  renderAuditReport,
  rowsFromDiagnostics,
  unverifiedRows,
  writeAuditReport,
};
