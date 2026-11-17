import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import {
  makeClaim,
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";
import type { MockReply } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime rt pending", () => {
  setupSubjectRuntimeHooks();

  it("shows Rotten Tomatoes while an IMDb match remains pending", async () => {
    const metacritic = Promise.withResolvers<MockReply>();
    const rtUrl = "https://www.rottentomatoes.com/m/shawshank_redemption";
    mockNetwork((url) => {
      if (url.includes("graphql.imdb.com")) {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt0111161",
                ratingsSummary: { aggregateRating: 9.3, voteCount: 1200 },
                titleText: { text: "The Shawshank Redemption" },
              },
            },
          }),
        };
      }
      if (url.includes("www.metacritic.com")) {
        return metacritic.promise;
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q172241" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [
                    {
                      mainsnak: {
                        datavalue: { value: "m/shawshank_redemption" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P1712: [makeClaim("movie/the-shawshank-redemption")],
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q11424" } },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P345: [
                    {
                      mainsnak: {
                        datavalue: { value: "tt0111161" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P4529: [
                    {
                      mainsnak: {
                        datavalue: { value: "1292052" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                },
              },
            },
          }),
        };
      }
      if (url === rtUrl) {
        return {
          body: `<!doctype html><link rel="canonical" href="${rtUrl}"><script type="application/ld+json">{"@type":"Movie"}</script><script data-json="mediaScorecard" type="application/json">{"criticsScore":{"scorePercent":"89%","ratingCount":147},"audienceScore":{"scorePercent":"98%","bandedRatingCount":"250,000+ Ratings"},"overlay":{"hasAudienceAll":true,"hasAudienceVerified":false,"audienceAll":{"scorePercent":"98%","bandedRatingCount":"250,000+ Ratings"}}}</script>`,
        };
      }
      return { body: "", status: 404 };
    });
    const root = document.createElement("div");
    render(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: "tt0111161" },
          title: { ...makeData().title, original: "The Shawshank Redemption" },
        })}
        doc={document}
      />,
      root
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%")
    );
    expect(
      root.querySelector(".is-audience .atv-rt-score-label")?.textContent
    ).toBe("观众");
    expect(
      root.querySelector(".atv-rt-audience .atv-rt-count-value")?.textContent
    ).toContain("250,000+");
    expect(
      root.querySelector(".atv-rating-panel-mc.is-loading")
    ).not.toBeNull();

    metacritic.resolve({ body: "", status: 503 });
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    render(null, root);
  });
});
