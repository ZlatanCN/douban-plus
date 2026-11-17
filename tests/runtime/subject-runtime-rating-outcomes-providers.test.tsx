import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import altruistsMetacriticFixture from "../fixtures/metacritic/the-altruists.json?raw";
import altruistsWikidataFixture from "../fixtures/wikidata/the-altruists.json?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  createRatingOutcomeCapture,
  mockNetwork,
  setupRatingOutcomeTest,
  waitForOutcomeReport,
} from "./subject-runtime-rating-outcomes-test-support";
import { makeData } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("SubjectPageRuntime rating outcomes", () => {
  setupRatingOutcomeTest();

  it("reports The Altruists as no-rating only after parsing its mapped Metacritic page", async () => {
    const { onRatingUpdate, outcomes } = createRatingOutcomeCapture();
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
        onRatingUpdate={onRatingUpdate}
      />
    );

    const report = await waitForOutcomeReport(
      outcomes,
      "mc",
      "source-no-rating"
    );
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
    const { onRatingUpdate, outcomes } = createRatingOutcomeCapture();
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
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={onRatingUpdate}
      />
    );
    const report = await waitForOutcomeReport(outcomes, "imdb", "parse-error");
    expect(
      report.records.find(({ source }) => source === "imdb")
    ).toMatchObject({
      errorCode: "invalid-json",
      reason: "parse-error",
      source: "imdb",
      stage: "parse",
    });
    render(null, root);
  });
});
