import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import gameOfThronesSeasonTwo from "../fixtures/metacritic/got-season-2-user-score.html?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  capturedSeasonPage,
  canonicalSeasonUrl,
  guessedSeasonUrl,
  guessedSeriesUrl,
  mockGameOfThronesNetwork,
  metacriticSeasonUrl,
} from "./subject-runtime-meta-season-mapping-user-score";
import {
  makeData,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime meta season mapping", () => {
  setupSubjectRuntimeHooks();

  it("uses the mapped season ID and binds the captured User score cards to season two", async () => {
    const requests: string[] = [];
    const updates: RatingUpdate[] = [];
    const responseOptions = {
      pageParentUrl: "https://www.metacritic.com/tv/game-of-thrones/",
      pageSeasonNumber: 2,
      userReviewSeason: 2,
    };
    mockGameOfThronesNetwork(requests, () =>
      capturedSeasonPage(gameOfThronesSeasonTwo, responseOptions)
    );
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
        scale: root.querySelector(".atv-mc-audience .atv-mc-score-scale")
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
      audience: { score: "9.1", scale: "/10", count: "评价 2,447" },
      rating: {
        audience: { displayScore: "9.1", reviewCount: 2447, score: 9.1 },
        object: { kind: "season", season: 2, subjectId: "6558062" },
      },
    });

    render(null, root);
    localStorage.clear();
    requests.length = 0;
    updates.length = 0;
    responseOptions.userReviewSeason = 3;
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
    responseOptions.userReviewSeason = 2;
    responseOptions.pageParentUrl =
      "https://www.metacritic.com/tv/another-series/";
    const crossParent = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossParent.querySelector(".atv-rating-panel-mc")).toBeNull()
    );

    render(null, crossParent);
    localStorage.clear();
    requests.length = 0;
    responseOptions.pageParentUrl =
      "https://www.metacritic.com/tv/game-of-thrones/";
    responseOptions.pageSeasonNumber = 3;
    const crossSeason = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossSeason.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
  });
});
