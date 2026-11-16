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

describe("Metacritic season conflict cache", () => {
  setupSubjectRuntimeHooks();

  it("does not show a cached series score when the page has conflicting season numbers", async () => {
    const now = Date.now();
    const subjectId = "3016187";
    const imdbId = "tt0944947";
    const target = {
      kind: "series",
      identityReferences: { creators: [], directors: [] },
      metacriticId: "tv/game-of-thrones",
      season: null,
      seriesId: "Q23572",
      seriesMetacriticId: "tv/game-of-thrones",
      status: "matched",
    };
    localStorage.setItem(
      "dp:metacritic-targets:v4",
      JSON.stringify([
        [
          JSON.stringify([subjectId, imdbId, "series", null]),
          {
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
            value: { status: "resolved", target, verifiedAt: now },
          },
        ],
      ])
    );
    localStorage.setItem(
      "dp:metacritic-snapshots:v1",
      JSON.stringify({
        [JSON.stringify([
          subjectId,
          "series",
          null,
          "Q23572",
          "tv/game-of-thrones",
          "tv/game-of-thrones",
        ])]: {
          fetchedAt: now,
          object: {
            kind: "series",
            metacriticId: "tv/game-of-thrones",
            season: null,
            seriesId: "Q23572",
            seriesMetacriticId: "tv/game-of-thrones",
            subjectId,
          },
          reviewCount: 100,
          score: 90,
          sourceUrl: "https://www.metacritic.com/tv/game-of-thrones/",
          stale: false,
        },
      })
    );
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: imdbId, selectedSeason: "1" },
          isTV: true,
          subjectId,
          title: {
            full: "Game of Thrones Season 2",
            original: "Game of Thrones Season 2",
            primary: "权力的游戏 第二季",
            seasonLabel: "Season 2",
          },
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    expect(requests).toStrictEqual([]);
  });
});
