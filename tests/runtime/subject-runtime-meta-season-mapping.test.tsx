import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  canonicalSeasonUrl,
  controlledSeasonUserScore,
  guessedSeasonUrl,
  guessedSeriesUrl,
  metacriticSeasonUrl,
} from "./subject-runtime-meta-season-mapping-user-score";
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

describe("subject runtime meta season mapping", () => {
  setupSubjectRuntimeHooks();

  it("uses the mapped season ID and binds the controlled User score card to season two", async () => {
    const requests: string[] = [];
    const updates: RatingUpdate[] = [];
    let pageParentUrl = "https://www.metacritic.com/tv/game-of-thrones/";
    let pageSeasonNumber = 2;
    let userReviewSeason = 2;
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt1971833",
                ratingsSummary: { aggregateRating: 8.6, voteCount: 52_000 },
                series: {
                  series: {
                    id: "tt0944947",
                    titleText: { text: "Game of Thrones" },
                  },
                },
                titleText: { text: "The North Remembers" },
              },
            },
          }),
        };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          const search = identifier.includes("P345=tt1971833")
            ? [{ title: "Q7754352" }]
            : [];
          return { body: JSON.stringify({ query: { search } }) };
        }
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        if (ids.includes("Q7754352")) {
          return {
            body: JSON.stringify({
              entities: {
                Q7754352: {
                  claims: {
                    P31: [makeClaim({ id: "Q21191270" })],
                    P345: [makeClaim("tt1971833")],
                    P4908: [
                      {
                        ...makeClaim({ id: "Q302358" }),
                        qualifiers: { P1545: [makeClaim("1")] },
                      },
                    ],
                  },
                },
              },
            }),
          };
        }
        if (ids.includes("Q302358")) {
          return {
            body: JSON.stringify({
              entities: {
                Q302358: {
                  claims: {
                    P1545: [makeClaim("2")],
                    P1712: [makeClaim("tv/game-of-thrones/season-2")],
                    P179: [makeClaim({ id: "Q23572" })],
                    P31: [makeClaim({ id: "Q3464665" })],
                  },
                },
              },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q23572: {
                id: "Q23572",
                claims: {
                  P31: [makeClaim({ id: "Q5398426" })],
                  P345: [makeClaim("tt0944947")],
                },
              },
            },
          }),
        };
      }
      if (url === metacriticSeasonUrl) {
        return {
          body: `<link rel="canonical" href="${canonicalSeasonUrl}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"TVSeason","name":"Game of Thrones: Season 2","seasonNumber":${pageSeasonNumber},"partOfSeries":{"@type":"TVSeries","url":"${pageParentUrl}"},"aggregateRating":{"@type":"AggregateRating","ratingValue":90,"reviewCount":26}}</script>${controlledSeasonUserScore(userReviewSeason)}`,
          finalUrl: canonicalSeasonUrl,
        };
      }
      if (url === guessedSeasonUrl) {
        return { body: "", status: 404 };
      }
      if (url === guessedSeriesUrl) {
        return {
          body: '<script type="application/ld+json">{"aggregateRating":{"ratingValue":84,"reviewCount":200}}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        episodes: "10",
        imdb: "tt1971833",
        seasons: "第2季",
        selectedSeason: "2",
      },
      isTV: true,
      subjectId: "6558062",
      title: {
        full: "权力的游戏 第二季 Game of Thrones Season 2",
        original: "A Song of Ice and Fire: Game of Thrones Season 2",
        primary: "权力的游戏 第二季",
        seasonLabel: "第二季",
      },
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
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("90")
    );
    expect({
      requestedMappedSeason: requests.includes(metacriticSeasonUrl),
      requestedNoGuessedSeason: !requests.includes(guessedSeasonUrl),
      requestedNoGuessedSeries: !requests.includes(guessedSeriesUrl),
      source: root.querySelector<HTMLAnchorElement>(".atv-metacritic-source")
        ?.href,
      audience: {
        score: root.querySelector(".atv-mc-audience .atv-mc-score-value")
          ?.textContent,
        count: root.querySelector(".atv-mc-audience .atv-mc-rating-count")
          ?.textContent,
      },
      rating: updates.findLast((update) => update.source === "mc")?.result
        .rating,
    }).toMatchObject({
      requestedMappedSeason: true,
      requestedNoGuessedSeason: true,
      requestedNoGuessedSeries: true,
      source: canonicalSeasonUrl,
      audience: { score: "8.2", count: "评价 42" },
      rating: {
        audience: { displayScore: "8.2", reviewCount: 42, score: 8.2 },
        object: { kind: "season", season: 2, subjectId: "6558062" },
      },
    });

    render(null, root);
    localStorage.clear();
    requests.length = 0;
    updates.length = 0;
    userReviewSeason = 3;
    const wrongAudienceSeason = renderIntoRoot(
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );
    await vi.waitFor(() =>
      expect(
        wrongAudienceSeason.querySelector(".atv-mc-critics .atv-mc-score-value")
          ?.textContent
      ).toBe("90")
    );
    expect({
      audience: wrongAudienceSeason.querySelector(".atv-mc-audience"),
      diagnostic: updates.findLast((update) => update.source === "mc")?.result
        .diagnostic,
      snapshots: localStorage.getItem("dp:metacritic-snapshots:v2"),
    }).toMatchObject({
      audience: null,
      diagnostic: {
        errorCode: "user-score-identity",
        reason: "parse-error",
      },
      snapshots: null,
    });
    render(null, wrongAudienceSeason);

    localStorage.clear();
    requests.length = 0;
    updates.length = 0;
    userReviewSeason = 2;
    pageParentUrl = "https://www.metacritic.com/tv/another-series/";
    const crossParent = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossParent.querySelector(".atv-rating-panel-mc")).toBeNull()
    );

    render(null, crossParent);
    localStorage.clear();
    requests.length = 0;
    pageParentUrl = "https://www.metacritic.com/tv/game-of-thrones/";
    pageSeasonNumber = 3;
    const crossSeason = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossSeason.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
  });
});
