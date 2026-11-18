import { render } from "preact";
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

describe("subject runtime episode season pairing", () => {
  setupSubjectRuntimeHooks();

  it("pairs the Game of Thrones season two first-episode mapping with a P179-only ablation", async () => {
    const doubanId = "6558062";
    const imdbId = "tt1971833";
    const episodeId = "Q7754352";
    const seriesUrl = "https://www.rottentomatoes.com/tv/game_of_thrones";
    const seasonUrl = `${seriesUrl}/s02`;
    const requests: string[] = [];
    let includeParentClaim = true;
    mockNetwork((url) => {
      requests.push(url);
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          return {
            body: JSON.stringify({
              query: {
                search: identifier.includes(`P345=${imdbId}`)
                  ? [{ title: episodeId }]
                  : [],
              },
            }),
          };
        }
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        const entities: Record<string, unknown> = {};
        if (ids.includes(episodeId)) {
          entities[episodeId] = {
            claims: {
              P1258: [makeClaim("tv/game_of_thrones/s02/e01")],
              ...(includeParentClaim
                ? { P179: [makeClaim({ id: "Q23572" })] }
                : {}),
              P31: [makeClaim({ id: "Q21191270" })],
              P345: [makeClaim(imdbId)],
            },
            id: episodeId,
          };
        }
        if (ids.includes("Q23572")) {
          entities.Q23572 = {
            claims: {
              P1258: [makeClaim("tv/game_of_thrones")],
              P31: [makeClaim({ id: "Q5398426" })],
            },
            id: "Q23572",
          };
        }
        return { body: JSON.stringify({ entities }) };
      }
      if (url === seriesUrl) {
        return {
          body:
            `<link rel="canonical" href="${seriesUrl}">` +
            '<script type="application/ld+json">{"@type":"TVSeries","name":"Game of Thrones"}</script>' +
            `<tile-season href="${seasonUrl}">Season 2</tile-season>`,
        };
      }
      if (url === seasonUrl) {
        return {
          body:
            `<link rel="canonical" href="${seasonUrl}">` +
            `<script type="application/ld+json">{"@type":"TVSeason","seasonNumber":2,"partOfSeries":{"@type":"TVSeries","url":"${seriesUrl}"}}</script>` +
            '<script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"97%","ratingCount":100}}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        episodes: "10",
        imdb: imdbId,
        seasons: "第2季",
        selectedSeason: "2",
      },
      isTV: true,
      subjectId: doubanId,
      title: {
        full: "权力的游戏 第2季 Game of Thrones Season 2",
        original: "Game of Thrones Season 2",
        primary: "权力的游戏 第2季",
        seasonLabel: "第2季",
      },
    });

    const fullRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      expect({
        scores: [...fullRoot.querySelectorAll(".atv-rt-score-value")].map(
          (node) => node.textContent?.trim()
        ),
        source:
          fullRoot.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href,
      }).toStrictEqual({ scores: ["97%"], source: seasonUrl });
    });
    expect({
      seriesRequested: requests.includes(seriesUrl),
      seasonRequested: requests.includes(seasonUrl),
    }).toStrictEqual({ seriesRequested: true, seasonRequested: true });
    render(null, fullRoot);

    localStorage.clear();
    requests.length = 0;
    includeParentClaim = false;
    const ablatedRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      expect(
        requests.filter((url) => url.includes("wikidata.org/w/api.php")).length
      ).toBeGreaterThanOrEqual(2);
    });
    await Promise.resolve();
    await Promise.resolve();
    expect({
      score: ablatedRoot.querySelector(".atv-rt-score-value"),
      source: ablatedRoot.querySelector(".atv-rt-source"),
      seriesRequested: requests.includes(seriesUrl),
      seasonRequested: requests.includes(seasonUrl),
    }).toStrictEqual({
      score: null,
      source: null,
      seriesRequested: false,
      seasonRequested: false,
    });
    render(null, ablatedRoot);
  });
});
