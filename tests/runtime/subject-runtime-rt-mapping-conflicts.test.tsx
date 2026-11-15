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

describe("subject runtime rt mapping conflicts", () => {
  setupSubjectRuntimeHooks();

  it("hides Rotten Tomatoes when the IMDb and Douban mappings conflict", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        const identifier = requestUrl.searchParams.get("srsearch") ?? "";
        const title = identifier.includes("P345=tt0111161")
          ? "Q172241"
          : "Q777";
        return { body: JSON.stringify({ query: { search: [{ title }] } }) };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q172241: {
              claims: {
                P1258: [makeClaim("m/shawshank_redemption")],
                P31: [makeClaim({ id: "Q11424" })],
                P345: [makeClaim("tt0111161")],
              },
            },
            Q777: {
              claims: {
                P1258: [makeClaim("m/shawshank_remake")],
                P31: [makeClaim({ id: "Q11424" })],
                P4529: [makeClaim("1292053")],
              },
            },
          },
        }),
      };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: "tt0111161" },
      subjectId: "1292053",
      title: {
        full: "The Shawshank Redemption",
        original: "The Shawshank Redemption",
        primary: "刺激1995",
        seasonLabel: "",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(
      requests.some((url) => url.includes("www.rottentomatoes.com"))
    ).toBeFalsy();
  });

  it("rejects ambiguous IMDb lookup even when the Douban lookup is unique", async () => {
    const requests: string[] = [];
    const matchingEntity = {
      claims: {
        P1258: [makeClaim("m/shawshank_redemption")],
        P31: [makeClaim({ id: "Q11424" })],
        P345: [makeClaim("tt0111161")],
        P4529: [makeClaim("1292052")],
      },
    };
    mockNetwork((url) => {
      requests.push(url);
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        const identifier = requestUrl.searchParams.get("srsearch") ?? "";
        const titles = identifier.includes("P345=tt0111161")
          ? [{ title: "Q172241" }, { title: "Q555" }]
          : [{ title: "Q172241" }];
        return { body: JSON.stringify({ query: { search: titles } }) };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q172241: matchingEntity,
            Q555: {
              claims: {
                P31: [makeClaim({ id: "Q11424" })],
                P345: [makeClaim("tt0111161")],
              },
            },
          },
        }),
      };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: "tt0111161" },
      title: {
        full: "The Shawshank Redemption",
        original: "The Shawshank Redemption",
        primary: "肖申克的救赎",
        seasonLabel: "",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(
      requests.some((url) => url.includes("www.rottentomatoes.com"))
    ).toBeFalsy();
  });

  it("checks the parent series before showing a season score", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
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
                  P1258: [makeClaim("tv/friends/s11")],
                  P31: [makeClaim({ id: "Q3464665" })],
                  P4529: [
                    {
                      ...makeClaim("1393859"),
                      qualifiers: { P1545: [makeClaim("11")] },
                    },
                  ],
                },
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/tv/friends/s11") {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/tv/friends/s11"><script type="application/ld+json">{"@type":"TVSeason","seasonNumber":11,"partOfSeries":{"@type":"TVSeries","url":"https://www.rottentomatoes.com/tv/wrong-series"}}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"90%","ratingCount":20}}</script>',
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
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(
      requests.some(
        (url) => url === "https://www.rottentomatoes.com/tv/friends/s11"
      )
    ).toBeTruthy();
  });
});
