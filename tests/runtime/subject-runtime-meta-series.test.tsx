import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeClaim,
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime meta series", () => {
  setupSubjectRuntimeHooks();

  it("resolves Lucky from IMDb and follows its Metacritic ID", async () => {
    const requests: string[] = [];
    const rtUrl = "https://www.rottentomatoes.com/tv/lucky_2026";
    const metacriticUrl = "https://www.metacritic.com/tv/lucky-2026/";
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                ratingsSummary: { aggregateRating: 7.5, voteCount: 100 },
                titleText: { text: "Lucky" },
              },
            },
          }),
        };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          const search = identifier.includes("P345=tt34866681")
            ? [{ title: "Q131378846" }]
            : [];
          return { body: JSON.stringify({ query: { search } }) };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q131378846: {
                claims: {
                  P1258: [makeClaim("tv/lucky_2026")],
                  P1712: [makeClaim("tv/lucky-2026")],
                  P31: [makeClaim({ id: "Q1259759" })],
                  P345: [makeClaim("tt34866681")],
                },
              },
            },
          }),
        };
      }
      if (url === rtUrl) {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/tv/lucky_2026"><script type="application/ld+json">{"@type":"TVSeries","name":"Lucky (2026)"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"80%","ratingCount":69},"audienceScore":{"scorePercent":"67%","bandedRatingCount":"250+ Ratings"},"overlay":{"hasAudienceAll":true,"hasAudienceVerified":false,"audienceAll":{"scorePercent":"67%","bandedRatingCount":"250+ Ratings"}}}</script>',
        };
      }
      if (url === metacriticUrl) {
        return {
          body:
            `<link rel="canonical" href="${metacriticUrl}">` +
            '<script type="application/ld+json">{"@type":"TVSeries","name":"Lucky (2026)","aggregateRating":{"ratingValue":68,"reviewCount":29}}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        episodes: "7",
        firstAired: "2026-07-15(美国)",
        imdb: "tt34866681",
      },
      isTV: true,
      subjectId: "37139034",
      title: {
        full: "幸运女神 Lucky",
        original: "Lucky",
        primary: "幸运女神",
        seasonLabel: "",
      },
      year: "2026",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["80%", "67%"])
    );
    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("68")
    );
    expect(requests).toContain(rtUrl);
    expect(requests).toContain(metacriticUrl);
    expect(requests).not.toContain("https://www.metacritic.com/tv/lucky");
  });
});
