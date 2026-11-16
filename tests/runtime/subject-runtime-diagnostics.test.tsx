import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import packageJson from "../../package.json";
import altruistsMetacriticFixture from "../fixtures/metacritic/the-altruists.json?raw";
import crewGirlFixture from "../fixtures/wikidata/crew-girl-mapping-missing.json?raw";
import altruistsWikidataFixture from "../fixtures/wikidata/the-altruists.json?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  makeClaim,
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

type FakeUserscriptApi = {
  getValue: (key: string, fallback: unknown) => Promise<unknown>;
  registerMenuCommand: (
    caption: string,
    onClick: () => void
  ) => number | Promise<number>;
  setClipboard: (text: string) => Promise<void>;
  setValue: (key: string, value: unknown) => Promise<void>;
  unregisterMenuCommand: (id: number) => void;
};

const diagnosticsHarness = vi.hoisted(() => {
  const values = new Map<string, unknown>();
  const commands = new Map<number, { caption: string; onClick: () => void }>();
  const copiedReports: string[] = [];
  let nextId = 0;
  const api = {
    getValue: vi.fn<FakeUserscriptApi["getValue"]>((key, fallback) =>
      Promise.resolve(values.has(key) ? values.get(key) : fallback)
    ),
    registerMenuCommand: vi.fn<FakeUserscriptApi["registerMenuCommand"]>(
      (caption, onClick) => {
        nextId += 1;
        commands.set(nextId, { caption, onClick });
        return nextId;
      }
    ),
    setValue: vi.fn<FakeUserscriptApi["setValue"]>((key, value) => {
      values.set(key, value);
      return Promise.resolve();
    }),
    setClipboard: vi.fn<FakeUserscriptApi["setClipboard"]>((text) => {
      copiedReports.push(text);
      return Promise.resolve();
    }),
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
  return { api, commands, copiedReports, values };
});

type DiagnosticReport = {
  records: {
    acceptedEvidence: string[];
    cacheAgeMs: number | null;
    candidateTargets: string[];
    errorCode: string | null;
    hasRating: boolean;
    missingEvidence: string[];
    reason: string;
    rejectedEvidence: string[];
    source: string;
    stage: string;
    target: string | null;
    unverifiedEvidence: string[];
  }[];
  scriptVersion: string;
  work: Record<string, unknown> | null;
};

const findMenuCommand = (captionPart: string) =>
  [...diagnosticsHarness.commands.values()].find(({ caption }) =>
    caption.includes(captionPart)
  );

const copiedReports = (): DiagnosticReport[] =>
  diagnosticsHarness.copiedReports.map((text) => JSON.parse(text));

const waitForCopiedReport = async (
  source: string,
  reason: string
): Promise<DiagnosticReport> => {
  let found: DiagnosticReport | undefined;
  await vi.waitFor(async () => {
    const command = findMenuCommand("复制本页报告");
    if (!command) {
      throw new Error("Copy menu command is not registered");
    }
    command.onClick();
    await Promise.resolve();
    found = copiedReports().find((report) =>
      report.records.some(
        (record) => record.source === source && record.reason === reason
      )
    );
    if (!found) {
      throw new Error(`Report does not yet contain ${source}:${reason}`);
    }
  });
  if (!found) {
    throw new Error(`Missing report for ${source}:${reason}`);
  }
  return found;
};

const waitForMenuCommand = async (captionPart: string): Promise<void> => {
  await vi.waitFor(() => {
    if (!findMenuCommand(captionPart)) {
      throw new Error(`Menu command is not registered: ${captionPart}`);
    }
  });
};

const waitForStoredPreference = async (value: boolean): Promise<void> => {
  await vi.waitFor(() => {
    if (
      diagnosticsHarness.values.get("dp:rating-diagnostics-enabled") !== value
    ) {
      throw new Error(`Preference did not become ${String(value)}`);
    }
  });
};

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime rating diagnostics", () => {
  setupSubjectRuntimeHooks();

  it("keeps the default-off menu preference enabled across a page refresh", async () => {
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.values.clear();
    diagnosticsHarness.copiedReports.length = 0;
    diagnosticsHarness.api.getValue.mockClear();
    diagnosticsHarness.api.registerMenuCommand.mockClear();
    diagnosticsHarness.api.setValue.mockClear();
    mockNetwork(() => ({ body: "", status: 404 }));

    const data = makeData();
    const firstRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    let toggle: { caption: string; onClick: () => void } | undefined;
    await vi.waitFor(() => {
      toggle = [...diagnosticsHarness.commands.values()].find(({ caption }) =>
        caption.includes("评分诊断：开启")
      );
      expect(toggle).toBeDefined();
    });
    expect(diagnosticsHarness.values.size).toBe(0);
    const copyBeforeEnable = [...diagnosticsHarness.commands.values()].find(
      ({ caption }) => caption.includes("复制本页报告")
    );
    copyBeforeEnable?.onClick();
    await vi.waitFor(() =>
      expect(diagnosticsHarness.copiedReports).toHaveLength(1)
    );
    expect(
      (
        JSON.parse(diagnosticsHarness.copiedReports[0] ?? "{}") as {
          records: unknown[];
        }
      ).records
    ).toStrictEqual([]);
    toggle?.onClick();
    await vi.waitFor(() => {
      expect(
        diagnosticsHarness.values.get("dp:rating-diagnostics-enabled")
      ).toBeTruthy();
    });
    render(null, firstRoot);
    diagnosticsHarness.copiedReports.length = 0;

    const secondRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      expect(
        [...diagnosticsHarness.commands.values()].some(({ caption }) =>
          caption.includes("评分诊断：关闭")
        )
      ).toBeTruthy();
    });
    expect(diagnosticsHarness.api.getValue).toHaveBeenCalledWith(
      "dp:rating-diagnostics-enabled",
      false
    );
    const copyAfterRefresh = [...diagnosticsHarness.commands.values()].find(
      ({ caption }) => caption.includes("复制本页报告")
    );
    await vi.waitFor(async () => {
      copyAfterRefresh?.onClick();
      await Promise.resolve();
      const reports = diagnosticsHarness.copiedReports.map(
        (text) => JSON.parse(text) as { records: unknown[] }
      );
      expect(reports.some((report) => report.records.length > 0)).toBeTruthy();
    });
    render(null, secondRoot);
  });

  it("failure-categorization ablation: distinguishes missing mapping from valid no-rating", async () => {
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.values.clear();
    diagnosticsHarness.values.set("dp:rating-diagnostics-enabled", true);
    diagnosticsHarness.copiedReports.length = 0;
    diagnosticsHarness.api.getValue.mockClear();
    diagnosticsHarness.api.registerMenuCommand.mockClear();
    diagnosticsHarness.api.setClipboard.mockReset();
    diagnosticsHarness.api.setClipboard.mockImplementation((text) => {
      diagnosticsHarness.copiedReports.push(text);
      return Promise.resolve();
    });
    let phase: "missing" | "no-rating" = "missing";
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: {
                search: phase === "missing" ? [] : [{ title: "Q900" }],
              },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q900: {
                claims: {
                  P31: [makeClaim({ id: "Q11424" })],
                  P1258: [makeClaim("m/diagnostic_test_film")],
                  P4529: [makeClaim("1292052")],
                },
                id: "Q900",
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/m/diagnostic_test_film") {
        return {
          body: `<link rel="canonical" href="${url}"><script type="application/ld+json">{"@type":"Movie","name":"Diagnostic Test Film"}</script><script data-json="mediaScorecard">{"criticsScore":null,"audienceScore":null}</script>`,
        };
      }
      return { body: "", status: 404 };
    });

    const data = makeData({
      info: { ...makeData().info, imdb: "" },
      title: {
        full: "Diagnostic Test Film",
        original: "Diagnostic Test Film",
        primary: "诊断测试电影",
        seasonLabel: "",
      },
    });
    const firstRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      if (
        requests.filter((url) => url.includes("wikidata.org/w/api.php"))
          .length < 2
      ) {
        throw new Error("Wikidata mapping requests have not completed");
      }
    });
    const missingReport = await waitForCopiedReport("rt", "mapping-missing");
    render(null, firstRoot);

    phase = "no-rating";
    requests.length = 0;
    const secondRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      if (
        !requests.includes(
          "https://www.rottentomatoes.com/m/diagnostic_test_film"
        )
      ) {
        throw new Error("Mapped Rotten Tomatoes page was not requested");
      }
    });
    const noRatingReport = await waitForCopiedReport("rt", "source-no-rating");
    const sourceReasons = [missingReport, noRatingReport].map(
      (report) =>
        report.records.find((record) => record.source === "rt")?.reason
    );
    expect(sourceReasons).toStrictEqual([
      "mapping-missing",
      "source-no-rating",
    ]);
    render(null, secondRoot);
  });

  it("runtime-reason-propagation ablation: preserves the source result in copied reports", async () => {
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.values.clear();
    diagnosticsHarness.values.set("dp:rating-diagnostics-enabled", true);
    diagnosticsHarness.copiedReports.length = 0;
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q901" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q901: {
                claims: {
                  P31: [makeClaim({ id: "Q11424" })],
                  P1258: [makeClaim("m/diagnostic_test_film")],
                  P4529: [makeClaim("1292052")],
                },
                id: "Q901",
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/m/diagnostic_test_film") {
        return {
          body: `<link rel="canonical" href="${url}"><script type="application/ld+json">{"@type":"Movie","name":"Diagnostic Test Film"}</script><script data-json="mediaScorecard">{"criticsScore":null,"audienceScore":null}</script>`,
        };
      }
      return { body: "", status: 404 };
    });

    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );
    await waitForMenuCommand("评分诊断：关闭");
    const report = await waitForCopiedReport("rt", "source-no-rating");
    findMenuCommand("评分诊断：关闭")?.onClick();
    await waitForStoredPreference(false);
    await waitForMenuCommand("评分诊断：开启");
    diagnosticsHarness.api.setClipboard.mockRejectedValueOnce(
      new Error("clipboard unavailable")
    );
    findMenuCommand("复制本页报告")?.onClick();
    await vi.waitFor(() => {
      if (
        !document.body.querySelector("#dp-rating-diagnostics-copy textarea")
      ) {
        throw new Error("Selectable report fallback was not shown");
      }
    });
    const fallbackTextarea = document.body.querySelector<HTMLTextAreaElement>(
      "#dp-rating-diagnostics-copy textarea"
    );
    const fallbackReport = JSON.parse(fallbackTextarea?.value ?? "{}") as {
      records?: unknown[];
    };
    const rtRecord = report.records.find((record) => record.source === "rt");
    const { work } = report;
    const reportKeys = Object.keys(report);
    const outputLength = diagnosticsHarness.copiedReports.at(-1)?.length ?? 0;
    const storedKeys = [...diagnosticsHarness.values.keys()];
    expect({
      fallbackRecords: fallbackReport.records,
      cacheAgeMs: rtRecord?.cacheAgeMs,
      errorCode: rtRecord?.errorCode,
      hasRating: rtRecord?.hasRating,
      outputLength,
      outputBounded: outputLength < 2000,
      reason: rtRecord?.reason,
      recordCount: report.records.length,
      reportKeys,
      rtStage: rtRecord?.stage,
      rtTarget: rtRecord?.target,
      acceptedEvidence: rtRecord?.acceptedEvidence,
      candidateTargets: rtRecord?.candidateTargets,
      missingEvidence: rtRecord?.missingEvidence,
      rejectedEvidence: rtRecord?.rejectedEvidence,
      unverifiedEvidence: rtRecord?.unverifiedEvidence,
      scriptVersion: report.scriptVersion,
      storedKeys,
      storedPreference: diagnosticsHarness.values.get(
        "dp:rating-diagnostics-enabled"
      ),
      work,
    }).toStrictEqual({
      fallbackRecords: [],
      cacheAgeMs: null,
      errorCode: null,
      hasRating: false,
      outputLength: expect.any(Number),
      outputBounded: true,
      reason: "source-no-rating",
      recordCount: 3,
      reportKeys: ["scriptVersion", "work", "records"],
      rtStage: "parse",
      rtTarget: "m/diagnostic_test_film",
      acceptedEvidence: ["exact-id", "type", "canonical"],
      candidateTargets: ["m/diagnostic_test_film", "1292052"],
      missingEvidence: ["aggregate-rating"],
      rejectedEvidence: [],
      unverifiedEvidence: [],
      scriptVersion: packageJson.version,
      storedKeys: ["dp:rating-diagnostics-enabled"],
      storedPreference: false,
      work: {
        imdbId: null,
        kind: "movie",
        season: null,
        subjectId: "1292052",
      },
    });
    render(null, root);
  });

  it("keeps Crew Girl unmapped when Wikidata has no source IDs", async () => {
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.values.clear();
    diagnosticsHarness.values.set("dp:rating-diagnostics-enabled", true);
    diagnosticsHarness.copiedReports.length = 0;
    const requests: string[] = [];
    const fixture = JSON.parse(crewGirlFixture) as {
      entity: { claims: Record<string, unknown>; id: string };
    };
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return { body: "{}", status: 404 };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const search = requestUrl.searchParams.get("srsearch") ?? "";
          return {
            body: JSON.stringify({
              query: {
                search: search.includes("P345=tt38218082")
                  ? [{ title: "Q141155312" }]
                  : [],
              },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: { Q141155312: fixture.entity },
          }),
        };
      }
      return { body: "", status: 404 };
    });

    const data = makeData({
      info: {
        ...makeData().info,
        firstAired: "2026-11-16",
        imdb: "tt38218082",
        selectedSeason: "Season 1",
      },
      isTV: true,
      subjectId: "37516033",
      title: {
        full: "Crew Girl Season 1",
        original: "Crew Girl",
        primary: "Crew Girl",
        seasonLabel: "Season 1",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    const rtReport = await waitForCopiedReport("rt", "mapping-missing");
    const mcReport = await waitForCopiedReport("mc", "mapping-missing");
    const rtRecord = rtReport.records.find((record) => record.source === "rt");
    const mcRecord = mcReport.records.find((record) => record.source === "mc");
    const sourceRequests = requests.filter(
      (url) =>
        url.startsWith("https://www.rottentomatoes.com/") ||
        url.startsWith("https://www.metacritic.com/")
    );
    const identityQueriesAreExact = requests
      .filter((url) => url.includes("wikidata.org/w/api.php"))
      .every((url) => {
        const search = new URL(url).searchParams.get("srsearch");
        return (
          search === null ||
          search === "haswbstatement:P345=tt38218082" ||
          search === "haswbstatement:P4529=37516033"
        );
      });
    expect({
      rt: {
        acceptedEvidence: rtRecord?.acceptedEvidence,
        acceptedEvidenceBounded: (rtRecord?.acceptedEvidence.length ?? 0) <= 8,
        candidateTargets: rtRecord?.candidateTargets,
        candidateTargetsBounded: (rtRecord?.candidateTargets.length ?? 0) <= 4,
        missingEvidence: rtRecord?.missingEvidence,
        rejectedEvidenceBounded: (rtRecord?.rejectedEvidence.length ?? 0) <= 8,
        unverifiedEvidence: rtRecord?.unverifiedEvidence,
      },
      mc: {
        acceptedEvidence: mcRecord?.acceptedEvidence,
        candidateTargets: mcRecord?.candidateTargets,
        missingEvidence: mcRecord?.missingEvidence,
        unverifiedEvidence: mcRecord?.unverifiedEvidence,
      },
      identityQueriesAreExact,
      sourceRequests,
    }).toStrictEqual({
      rt: {
        acceptedEvidence: expect.arrayContaining(["exact-id", "type"]),
        acceptedEvidenceBounded: true,
        candidateTargets: expect.arrayContaining([
          "Q141155312",
          "tt38218082",
          "37516033",
        ]),
        candidateTargetsBounded: true,
        missingEvidence: expect.arrayContaining(["exact-id"]),
        rejectedEvidenceBounded: true,
        unverifiedEvidence: expect.arrayContaining(["aggregate-rating"]),
      },
      mc: {
        acceptedEvidence: expect.arrayContaining(["exact-id", "type"]),
        candidateTargets: expect.arrayContaining([
          "Q141155312",
          "tt38218082",
          "37516033",
        ]),
        missingEvidence: expect.arrayContaining(["exact-id"]),
        unverifiedEvidence: expect.arrayContaining(["aggregate-rating"]),
      },
      identityQueriesAreExact: true,
      sourceRequests: [],
    });
    render(null, root);
  });

  it("reports The Altruists as no-rating only after parsing its mapped Metacritic page", async () => {
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.values.clear();
    diagnosticsHarness.values.set("dp:rating-diagnostics-enabled", true);
    diagnosticsHarness.copiedReports.length = 0;
    const wikidata = JSON.parse(altruistsWikidataFixture) as {
      entity: { claims: Record<string, unknown>; id: string };
    };
    const metacritic = JSON.parse(altruistsMetacriticFixture) as {
      canonicalUrl: string;
      criticReviewsMessage: string;
      jsonLd: Record<string, unknown>;
      sourceUrl: string;
    };
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt36786185",
                ratingsSummary: { aggregateRating: null, voteCount: null },
                titleText: { text: "The Altruists" },
                titleType: { id: "tvSeries" },
              },
            },
          }),
        };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const search = requestUrl.searchParams.get("srsearch") ?? "";
          return {
            body: JSON.stringify({
              query: {
                search: search.includes("P345=tt36786185")
                  ? [{ title: "Q135470331" }]
                  : [],
              },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: { Q135470331: wikidata.entity },
          }),
        };
      }
      if (url === metacritic.sourceUrl) {
        return {
          body:
            `<link rel="canonical" href="${metacritic.canonicalUrl}">` +
            `<p>${metacritic.criticReviewsMessage}</p>` +
            `<script type="application/ld+json">${JSON.stringify(metacritic.jsonLd)}</script>`,
        };
      }
      return { body: "", status: 404 };
    });

    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: {
            ...makeData().info,
            firstAired: "2026-11-19",
            imdb: "tt36786185",
          },
          isTV: true,
          subjectId: "1000000001",
          title: {
            full: "The Altruists",
            original: "The Altruists",
            primary: "The Altruists",
            seasonLabel: "",
          },
          year: "2026",
        })}
        doc={document}
      />
    );

    const report = await waitForCopiedReport("mc", "source-no-rating");
    const mcRecord = report.records.find((record) => record.source === "mc");
    expect(mcRecord).toMatchObject({
      acceptedEvidence: expect.arrayContaining([
        "exact-id",
        "type",
        "canonical",
      ]),
      candidateTargets: expect.arrayContaining([
        "Q135470331",
        "tv/the-altruists",
      ]),
      missingEvidence: ["aggregate-rating"],
      reason: "source-no-rating",
      target: "tv/the-altruists",
      unverifiedEvidence: [],
    });
    expect(requests).toContain(metacritic.sourceUrl);
    expect(
      requests.some((url) => url.startsWith("https://www.rottentomatoes.com/"))
    ).toBeFalsy();
    expect(JSON.stringify(report)).not.toContain(
      "Critic reviews are not available yet"
    );
    expect(JSON.stringify(report)).not.toContain("aggregateRating");
    render(null, root);
  });

  it("reports a malformed IMDb response as parse-error through SubjectPageRuntime", async () => {
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.values.clear();
    diagnosticsHarness.values.set("dp:rating-diagnostics-enabled", true);
    diagnosticsHarness.copiedReports.length = 0;
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return { body: "not-json" };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        return requestUrl.searchParams.get("action") === "query"
          ? { body: JSON.stringify({ query: { search: [] } }) }
          : { body: JSON.stringify({ entities: {} }) };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: "tt1234567" },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(requests).toContain("https://graphql.imdb.com/")
    );
    const copyCommand = () =>
      [...diagnosticsHarness.commands.values()].find(({ caption }) =>
        caption.includes("复制本页报告")
      );
    await vi.waitFor(async () => {
      copyCommand()?.onClick();
      await Promise.resolve();
      const reports = diagnosticsHarness.copiedReports.map(
        (text) =>
          JSON.parse(text) as {
            records: {
              errorCode: string | null;
              reason: string;
              source: string;
              stage: string;
            }[];
          }
      );
      expect(
        reports.some((report) =>
          report.records.some(
            (record) =>
              record.source === "imdb" &&
              record.reason === "parse-error" &&
              record.stage === "parse" &&
              record.errorCode === "invalid-json"
          )
        )
      ).toBeTruthy();
    });
    render(null, root);
  });

  it("keeps rating acquisition independent of slow menu setup", async () => {
    diagnosticsHarness.values.clear();
    diagnosticsHarness.commands.clear();
    const { promise: pendingPreference } = Promise.withResolvers<unknown>();
    const { promise: pendingRegistration } = Promise.withResolvers<number>();
    diagnosticsHarness.api.getValue.mockReturnValue(pendingPreference);
    diagnosticsHarness.api.registerMenuCommand.mockReturnValue(
      pendingRegistration
    );
    mockNetwork((url) =>
      url === "https://graphql.imdb.com/"
        ? {
            body: JSON.stringify({
              data: {
                title: {
                  id: "tt1234567",
                  ratingsSummary: { aggregateRating: 8.2, voteCount: 87 },
                  titleText: { text: "Diagnostic Test Film" },
                  titleType: { id: "movie" },
                },
              },
            }),
          }
        : { body: "", status: 404 }
    );

    const data = makeData({
      info: { ...makeData().info, imdb: "tt1234567" },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        root.querySelector(".atv-rating-panel-imdb .atv-rating-panel-score")
          ?.textContent
      ).toBe("8.2");
    });
    render(null, root);
  });

  it("keeps rating acquisition independent when menu APIs fail", async () => {
    diagnosticsHarness.values.clear();
    diagnosticsHarness.commands.clear();
    diagnosticsHarness.api.getValue.mockRejectedValue(
      new Error("storage unavailable")
    );
    diagnosticsHarness.api.registerMenuCommand.mockImplementation(() => {
      throw new Error("menu unavailable");
    });
    mockNetwork((url) =>
      url === "https://graphql.imdb.com/"
        ? {
            body: JSON.stringify({
              data: {
                title: {
                  id: "tt1234567",
                  ratingsSummary: { aggregateRating: 8.2, voteCount: 87 },
                  titleText: { text: "Diagnostic Test Film" },
                  titleType: { id: "movie" },
                },
              },
            }),
          }
        : { body: "", status: 404 }
    );

    const data = makeData({
      info: { ...makeData().info, imdb: "tt1234567" },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      expect(
        root.querySelector(".atv-rating-panel-imdb .atv-rating-panel-score")
          ?.textContent
      ).toBe("8.2");
    });
    render(null, root);
  });
});
