import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";
import { readSubjectData } from "@/modules/subject/runtime/read-subject-data";

import sampleManifest from "../fixtures/external-ratings/v1/manifest.json";
import { renderIntoRoot } from "../helpers/render";
import {
  mockGmXmlHttpRequest,
  setupSubjectRuntimeHooks,
} from "../runtime/subject-runtime-test-utils";

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
type DiagnosticsReport = { records: DiagnosticRecord[] };
type NetworkObservation = {
  finalUrl: string;
  restricted: boolean;
  requestUrl: string;
  status: number;
};
type FakeUserscriptApi = {
  getValue: (key: string, fallback: unknown) => Promise<unknown>;
  registerMenuCommand: (
    caption: string,
    onClick: () => void
  ) => number | Promise<number>;
  setClipboard: (text: string, type?: string) => Promise<void>;
  setValue: (key: string, value: boolean) => Promise<void>;
  unregisterMenuCommand: (id: number) => void | Promise<void>;
};

const auditHarness = vi.hoisted(() => {
  const commands = new Map<number, { caption: string; onClick: () => void }>();
  const clipboardReports: string[] = [];
  let nextCommandId = 0;
  const xhr = vi.fn<NonNullable<typeof globalThis.GM_xmlhttpRequest>>();
  const api = {
    getValue: vi.fn<FakeUserscriptApi["getValue"]>((_key, _fallback) =>
      Promise.resolve(true)
    ),
    registerMenuCommand: vi.fn<FakeUserscriptApi["registerMenuCommand"]>(
      (caption, onClick) => {
        nextCommandId += 1;
        commands.set(nextCommandId, { caption, onClick });
        return nextCommandId;
      }
    ),
    setClipboard: vi.fn<FakeUserscriptApi["setClipboard"]>((text) => {
      clipboardReports.push(text);
      return Promise.resolve();
    }),
    setValue: vi.fn<FakeUserscriptApi["setValue"]>(() => Promise.resolve()),
    unregisterMenuCommand: vi.fn<FakeUserscriptApi["unregisterMenuCommand"]>(
      (id) => {
        commands.delete(id);
      }
    ),
  } satisfies FakeUserscriptApi;
  Object.defineProperty(globalThis, "GM", {
    configurable: true,
    value: api,
  });
  globalThis.GM_xmlhttpRequest = xhr as never;
  const networkObservations: NetworkObservation[] = [];
  return { api, clipboardReports, commands, networkObservations };
});

const liveAuditEnabled = process.env.DP_LIVE_RATING_AUDIT === "1";

const classifyDiagnostic = (
  record: DiagnosticRecord | undefined,
  observations: NetworkObservation[] = [],
  visibleRating = false
): AuditStatus => {
  if (
    !record ||
    record.reason === "cancelled" ||
    record.reason === "request-error"
  ) {
    return "unverified";
  }
  if (
    observations.some((observation) =>
      isRestrictedResponse(record.source, observation)
    )
  ) {
    return "unverified";
  }
  if (record.reason === "rating") {
    return visibleRating ? "pass" : "fail";
  }
  if (record.reason === "source-no-rating") {
    return visibleRating ? "fail" : "pass";
  }
  return "fail";
};

const isRestrictedResponse = (
  source: Source,
  observation: NetworkObservation
): boolean => {
  const request = new URL(observation.requestUrl);
  const final = new URL(observation.finalUrl || observation.requestUrl);
  const sourceHost = {
    imdb: "imdb.com",
    mc: "metacritic.com",
    rt: "rottentomatoes.com",
  }[source];
  const isProviderResponse =
    request.hostname === sourceHost ||
    request.hostname.endsWith(`.${sourceHost}`) ||
    request.hostname === "www.wikidata.org";
  if (!isProviderResponse) {
    return false;
  }
  if (
    observation.status === 401 ||
    observation.status === 403 ||
    observation.status === 407 ||
    observation.status === 429 ||
    observation.status >= 500
  ) {
    return true;
  }
  if (
    (request.hostname === sourceHost ||
      request.hostname.endsWith(`.${sourceHost}`)) &&
    final.hostname !== sourceHost &&
    !final.hostname.endsWith(`.${sourceHost}`)
  ) {
    return true;
  }
  return observation.restricted;
};

const responseIsRestricted = (input: {
  finalUrl: string;
  requestUrl: string;
  responseText: string;
  status: number;
}): boolean => {
  if (
    input.status === 401 ||
    input.status === 403 ||
    input.status === 407 ||
    input.status === 429 ||
    input.status >= 500
  ) {
    return true;
  }
  const request = new URL(input.requestUrl);
  const final = new URL(input.finalUrl || input.requestUrl);
  if (final.hostname === "sec.douban.com" || final.pathname.startsWith("/c")) {
    return true;
  }
  const providerRoots = [
    "douban.com",
    "imdb.com",
    "metacritic.com",
    "rottentomatoes.com",
    "wikidata.org",
  ];
  const requestRoot = providerRoots.find(
    (root) => request.hostname === root || request.hostname.endsWith(`.${root}`)
  );
  const finalRoot = providerRoots.find(
    (root) => final.hostname === root || final.hostname.endsWith(`.${root}`)
  );
  if (requestRoot && finalRoot !== requestRoot) {
    return true;
  }
  return /captcha|access denied|temporarily blocked|request blocked|verify (?:that )?you are human|unusual traffic|robot check/iu.test(
    input.responseText.slice(0, 10_000)
  );
};

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
    "`request-error`, cancellation, blocked Douban extraction, and missing diagnostics are unverified. They are never reported as passes or as source-no-rating.",
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

const installFetchBackedGmTransport = (): void => {
  auditHarness.networkObservations.length = 0;
  mockGmXmlHttpRequest.mockImplementation(((request: {
    data?: string;
    headers?: Record<string, string>;
    method?: string;
    onabort?: () => void;
    onerror?: () => void;
    onload: (response: {
      finalUrl: string;
      responseText: string;
      status: number;
    }) => void;
    ontimeout?: () => void;
    timeout?: number;
    url: string;
  }) => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, request.timeout ?? 15_000);
    void (async () => {
      try {
        const response = await fetch(request.url, {
          body: request.data,
          credentials: "omit",
          headers: request.headers,
          method: request.method ?? "GET",
          redirect: "follow",
          signal: controller.signal,
        });
        const responseText = await response.text();
        clearTimeout(timer);
        auditHarness.networkObservations.push({
          finalUrl: response.url || request.url,
          restricted: responseIsRestricted({
            finalUrl: response.url || request.url,
            requestUrl: request.url,
            responseText,
            status: response.status,
          }),
          requestUrl: request.url,
          status: response.status,
        });
        request.onload({
          finalUrl: response.url || request.url,
          responseText,
          status: response.status,
        });
      } catch {
        clearTimeout(timer);
        if (timedOut) {
          request.ontimeout?.();
        } else if (controller.signal.aborted) {
          request.onabort?.();
        } else {
          request.onerror?.();
        }
      }
    })();
    return {
      abort: () => {
        controller.abort();
        request.onabort?.();
      },
    };
  }) as never);
};

describe("live rating audit report classification", () => {
  it("keeps request restrictions and missing records unverified", () => {
    expect(
      classifyDiagnostic({
        cacheAgeMs: null,
        errorCode: "network-failure",
        reason: "request-error",
        source: "rt",
        stage: "request",
        target: null,
      })
    ).toBe("unverified");
    expect(classifyDiagnostic(undefined)).toBe("unverified");
    expect(
      classifyDiagnostic(
        {
          cacheAgeMs: null,
          errorCode: "invalid-page",
          reason: "parse-error",
          source: "mc",
          stage: "parse",
          target: null,
        },
        [
          {
            finalUrl: "https://www.metacritic.com/",
            restricted: true,
            requestUrl: "https://www.metacritic.com/movie/sample/",
            status: 200,
          },
        ]
      )
    ).toBe("unverified");
    expect(
      classifyDiagnostic({
        cacheAgeMs: null,
        errorCode: null,
        reason: "source-no-rating",
        source: "rt",
        stage: "rating",
        target: "m/sample",
      })
    ).toBe("pass");
  });
});

describe.skipIf(!liveAuditEnabled)("opt-in live rating audit", () => {
  setupSubjectRuntimeHooks();

  it("writes pass/fail/unverified outcomes from the real SubjectPageRuntime path", async () => {
    const checkedAt = new Date().toISOString();
    const rows: AuditRow[] = [];
    auditHarness.commands.clear();
    auditHarness.clipboardReports.length = 0;
    installFetchBackedGmTransport();

    for (const sample of sampleManifest.samples) {
      let snapshot: Awaited<ReturnType<typeof readSubjectData>>;
      try {
        // eslint-disable-next-line no-await-in-loop -- runtime pages share one DOM and storage namespace.
        snapshot = await readSubjectData(sample.work.doubanSubjectId);
      } catch {
        rows.push(
          ...unverifiedRows(
            sample,
            checkedAt,
            "douban-source-unavailable",
            "douban-extraction"
          )
        );
        continue;
      }

      const root = renderIntoRoot(
        <SubjectPageRuntime data={snapshot.data} doc={document} />
      );
      let report: DiagnosticsReport | undefined;
      try {
        // eslint-disable-next-line no-await-in-loop -- each diagnostic report is read before the next sample mounts.
        await vi.waitFor(
          async () => {
            const copyCommand = [...auditHarness.commands.values()].find(
              ({ caption }) => caption.includes("复制本页报告")
            );
            expect(copyCommand).toBeDefined();
            copyCommand?.onClick();
            await Promise.resolve();
            const text = auditHarness.clipboardReports.at(-1);
            expect(text).toBeDefined();
            const candidate = JSON.parse(text ?? "{}") as DiagnosticsReport;
            expect(candidate.records).toHaveLength(3);
            report = candidate;
          },
          { interval: 250, timeout: 60_000 }
        );
      } catch {
        report = undefined;
      }
      if (report) {
        rows.push(
          ...rowsFromDiagnostics(
            sample,
            checkedAt,
            report.records,
            auditHarness.networkObservations,
            {
              imdb: Boolean(
                root
                  .querySelector(
                    ".atv-rating-panel-imdb .atv-rating-panel-score"
                  )
                  ?.textContent?.trim()
              ),
              mc: Boolean(
                root
                  .querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
                  ?.textContent?.trim()
              ),
              rt: [...root.querySelectorAll(".atv-rt-score-value")].some(
                (node) => Boolean(node.textContent?.trim())
              ),
            }
          )
        );
      } else {
        rows.push(
          ...unverifiedRows(
            sample,
            checkedAt,
            "runtime-diagnostics-incomplete",
            "runtime"
          )
        );
      }
      render(null, root);
    }

    const reportPath = await writeAuditReport(rows);
    console.info(`Live rating audit report: ${reportPath}`);
    console.info(renderAuditReport(rows));
    expect(rows.some((row) => row.status === "fail")).toBeFalsy();
  }, 90_000);
});
