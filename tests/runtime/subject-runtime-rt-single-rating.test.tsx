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

describe("subject runtime rt single rating", () => {
  setupSubjectRuntimeHooks();

  it("keeps each Rotten Tomatoes count with its side when one count is missing", async () => {
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: { search: [{ title: "Q172241" }] },
            }),
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
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q11424" } },
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
      if (url === "https://www.rottentomatoes.com/m/shawshank_redemption") {
        return {
          body: `<!doctype html><html><head>
            <link rel="canonical" href="https://www.rottentomatoes.com/m/shawshank_redemption">
            <script type="application/ld+json">{"@type":"Movie","url":"https://www.rottentomatoes.com/m/shawshank_redemption","name":"The Shawshank Redemption","datePublished":"1994"}</script>
            <script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"89%"},"audienceScore":{"scorePercent":"98%","bandedRatingCount":"100+ Ratings"}}</script>
          </head><body></body></html>`,
        };
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        root
          .querySelector(".atv-rating-panel-rt")
          ?.classList.contains("is-loaded")
      ).toBeTruthy()
    );

    const critics = root.querySelector(".atv-rt-critics");
    const audience = root.querySelector(".atv-rt-audience");
    expect({
      critics: {
        score: critics?.querySelector(".atv-rt-score-value")?.textContent,
        scale: critics?.querySelector(".atv-rt-score-scale")?.textContent,
        count: critics?.querySelector(".atv-rt-count-value")?.textContent,
        emptyCountHidden: critics
          ?.querySelector(".atv-rt-count-value")
          ?.getAttribute("aria-hidden"),
      },
      audience: {
        score: audience?.querySelector(".atv-rt-score-value")?.textContent,
        scale: audience?.querySelector(".atv-rt-score-scale")?.textContent,
        count: audience?.querySelector(".atv-rt-count-value")?.textContent,
      },
    }).toStrictEqual({
      critics: {
        score: "89%",
        scale: "%",
        count: "",
        emptyCountHidden: "true",
      },
      audience: { score: "98%", scale: "%", count: "100+" },
    });
  });

  it("shows a scorePercent result for a Douban subject without an IMDb ID", async () => {
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: { search: [{ title: "Q172241" }] },
            }),
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
                  P31: [
                    {
                      mainsnak: {
                        datavalue: { value: { id: "Q11424" } },
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
      if (url === "https://www.rottentomatoes.com/m/shawshank_redemption") {
        return {
          body: `<!doctype html><html><head>
            <link rel="canonical" href="https://www.rottentomatoes.com/m/shawshank_redemption">
            <script type="application/ld+json">{"@type":"Movie","url":"https://www.rottentomatoes.com/m/shawshank_redemption","name":"The Shawshank Redemption","datePublished":"1994"}</script>
            <script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"0%","ratingCount":147},"audienceScore":null}</script>
          </head><body></body></html>`,
        };
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("0%");
    });

    expect(
      [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
        node.textContent?.trim()
      )
    ).toStrictEqual(["0%"]);
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/m/shawshank_redemption"
    );
  });
});
