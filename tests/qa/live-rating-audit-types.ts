type Source = "imdb" | "mc" | "rt";
type AuditStatus = "fail" | "pass" | "unverified";
type DiagnosticRecord = {
  cacheAgeMs: number | null;
  errorCode: string | null;
  reason: string;
  source: Source;
  stage: string;
  target: string | null;
};
type AuditRow = {
  checkedAt: string;
  errorCode: string | null;
  expectedGranularity: string;
  historicalExpected: string;
  reason: string;
  sampleId: string;
  source: Source;
  sourceUrl: string;
  stage: string;
  status: AuditStatus;
  target: string | null;
};
type NetworkObservation = {
  finalUrl: string;
  restricted: boolean;
  requestUrl: string;
  status: number;
};

export {
  type AuditRow,
  type AuditStatus,
  type DiagnosticRecord,
  type NetworkObservation,
  type Source,
};
