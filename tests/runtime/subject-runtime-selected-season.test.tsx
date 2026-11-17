import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime selected season", () => {
  setupSubjectRuntimeHooks();

  it("uses the selected season and displays the matching RT season page", async () => {
    const seasonUrl = "https://www.rottentomatoes.com/tv/friends/s11";
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q975761" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q975761: {
                claims: {
                  P1258: [
                    {
                      mainsnak: {
                        datavalue: { value: "tv/friends/s11" },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q3464665" } },
                        snaktype: "value",
                      },
                      rank: "normal",
                    },
                  ],
                  P4529: [
                    {
                      mainsnak: {
                        datavalue: { value: "1393859" },
                        snaktype: "value",
                      },
                      qualifiers: {
                        P1545: [
                          {
                            mainsnak: {
                              datavalue: { value: "11" },
                              snaktype: "value",
                            },
                            rank: "normal",
                          },
                        ],
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
      if (url === seasonUrl) {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/tv/friends/s11"><script type="application/ld+json">{"@type":"TVSeason","seasonNumber":11,"partOfSeries":{"@type":"TVSeries","name":"Friends","url":"https://www.rottentomatoes.com/tv/friends"}}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"91%","ratingCount":20},"audienceScore":null}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        seasons: "第十一季",
        selectedSeason: "第十一季",
      },
      isTV: true,
      subjectId: "1393859",
      title: {
        full: "老友记 第十一季",
        original: "Friends Season 11",
        primary: "老友记",
        seasonLabel: "第十一季",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("91%")
    );
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      seasonUrl
    );
    expect(root.querySelector(".atv-rating-dual-label")?.textContent).toContain(
      "影评人"
    );
  });
});
