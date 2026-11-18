import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import luckyMetacritic from "../fixtures/metacritic/lucky-2026-user-score.html?raw";
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
    const updates: RatingUpdate[] = [];
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
        return { body: luckyMetacritic };
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
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
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
    expect({
      criticScale: root.querySelector(".atv-mc-critics .atv-mc-score-scale")
        ?.textContent,
      criticCount: root.querySelector(".atv-mc-critics .atv-mc-rating-count")
        ?.textContent,
      audienceScore: root.querySelector(".atv-mc-audience .atv-mc-score-value")
        ?.textContent,
      audienceScale: root.querySelector(".atv-mc-audience .atv-mc-score-scale")
        ?.textContent,
      audienceCount: root.querySelector(".atv-mc-audience .atv-mc-rating-count")
        ?.textContent,
      rating: updates.findLast((update) => update.source === "mc")?.result,
      requested: {
        rt: requests.includes(rtUrl),
        metacritic: requests.includes(metacriticUrl),
        guessedMetacritic: requests.includes(
          "https://www.metacritic.com/tv/lucky"
        ),
      },
    }).toMatchObject({
      criticScale: "/100",
      criticCount: "评价 29",
      audienceScore: "5.0",
      audienceScale: "/10",
      audienceCount: "评价 67",
      rating: {
        diagnostic: { reason: "rating" },
        rating: {
          audience: { displayScore: "5.0", reviewCount: 67, score: 5 },
          critics: { displayScore: "68", reviewCount: 29, score: 68 },
        },
      },
      requested: { rt: true, metacritic: true, guessedMetacritic: false },
    });
  });
});
