import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import crewGirlFixture from "../fixtures/wikidata/crew-girl-mapping-missing.json?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  createRatingOutcomeCapture,
  makeCrewGirlData,
  mockNetwork,
  setupRatingOutcomeTest,
  summarizeIdentityRequests,
  waitForOutcomeReport,
} from "./subject-runtime-rating-outcomes-test-support";
import { makeClaim, makeData } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("SubjectPageRuntime rating outcomes", () => {
  setupRatingOutcomeTest();

  it("failure-categorization ablation: distinguishes missing mapping from valid no-rating", async () => {
    const { onRatingUpdate, outcomes } = createRatingOutcomeCapture();
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
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={onRatingUpdate}
      />
    );
    await vi.waitFor(() => {
      if (
        requests.filter((url) => url.includes("wikidata.org/w/api.php"))
          .length < 2
      ) {
        throw new Error("Wikidata mapping requests have not completed");
      }
    });
    const missingReport = await waitForOutcomeReport(
      outcomes,
      "rt",
      "mapping-missing"
    );
    render(null, firstRoot);

    phase = "no-rating";
    requests.length = 0;
    const secondRoot = renderIntoRoot(
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={onRatingUpdate}
      />
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
    const noRatingReport = await waitForOutcomeReport(
      outcomes,
      "rt",
      "source-no-rating"
    );
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

  it("keeps Crew Girl unmapped when Wikidata has no source IDs", async () => {
    const { onRatingUpdate, outcomes } = createRatingOutcomeCapture();
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

    const data = makeCrewGirlData();
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={onRatingUpdate}
      />
    );

    const rtReport = await waitForOutcomeReport(
      outcomes,
      "rt",
      "mapping-missing"
    );
    const mcReport = await waitForOutcomeReport(
      outcomes,
      "mc",
      "mapping-missing"
    );
    const rtRecord = rtReport.records.find((record) => record.source === "rt");
    const mcRecord = mcReport.records.find((record) => record.source === "mc");
    const { identityQueriesAreExact, sourceRequests } =
      summarizeIdentityRequests(requests, "tt38218082", "37516033");
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
});
