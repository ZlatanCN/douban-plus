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

describe("subject runtime meta season ordinal", () => {
  setupSubjectRuntimeHooks();

  it("resolves a Metacritic season ID when Wikidata omits the season ordinal", async () => {
    const requests: string[] = [];
    const metacriticSeasonUrl =
      "https://www.metacritic.com/tv/game-of-thrones/season-8/";
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt5924366",
                ratingsSummary: { aggregateRating: 7.6, voteCount: 100_000 },
                series: {
                  series: {
                    id: "tt0944947",
                    titleText: { text: "Game of Thrones" },
                  },
                },
                titleText: { text: "Winterfell" },
              },
            },
          }),
        };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          let search: { title: string }[] = [];
          if (identifier.includes("P345=tt5924366")) {
            search = [{ title: "Q63154005" }];
          } else if (identifier.includes("P4529=26584183")) {
            search = [{ title: "Q30887543" }];
          }
          return { body: JSON.stringify({ query: { search } }) };
        }
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        const entities: Record<string, unknown> = {};
        if (ids.includes("Q63154005")) {
          entities.Q63154005 = {
            claims: {
              P179: [makeClaim({ id: "Q23572" })],
              P31: [makeClaim({ id: "Q21191270" })],
              P345: [makeClaim("tt5924366")],
              P4908: [makeClaim({ id: "Q30887543" })],
            },
            id: "Q63154005",
          };
        }
        if (ids.includes("Q30887543")) {
          entities.Q30887543 = {
            claims: {
              P1712: [makeClaim("tv/game-of-thrones/season-8")],
              P179: [makeClaim({ id: "Q23572" })],
              P31: [makeClaim({ id: "Q3464665" })],
            },
            id: "Q30887543",
          };
        }
        if (ids.includes("Q23572")) {
          entities.Q23572 = {
            claims: {
              P31: [makeClaim({ id: "Q5398426" })],
              P345: [makeClaim("tt0944947")],
            },
            id: "Q23572",
          };
        }
        return { body: JSON.stringify({ entities }) };
      }
      if (url === metacriticSeasonUrl) {
        return {
          body:
            `<link rel="canonical" href="${metacriticSeasonUrl}">` +
            '<script type="application/ld+json">{"@context":"https://schema.org","@type":"TVSeason","name":"Game of Thrones: Season 8","seasonNumber":8,"partOfSeries":{"@type":"TVSeries","url":"https://www.metacritic.com/tv/game-of-thrones/"},"aggregateRating":{"@type":"AggregateRating","ratingValue":57,"reviewCount":24}}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        episodes: "6",
        imdb: "tt5924366",
        seasons: "第八季",
        selectedSeason: "8",
      },
      isTV: true,
      subjectId: "26584183",
      title: {
        full: "权力的游戏 第八季 Game of Thrones Season 8",
        original: "Game of Thrones Season 8",
        primary: "权力的游戏 第八季",
        seasonLabel: "第八季",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("57")
    );
    expect(requests).toContain(metacriticSeasonUrl);
  });
});
