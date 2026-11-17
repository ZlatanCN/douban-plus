import { render } from "preact";
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

const snapshotStorageKey = "dp:metacritic-snapshots:v2";
const metacriticId = "movie/spider-man-into-the-spider-verse";
const subjectId = "26374197";
const sourceUrl = `https://www.metacritic.com/${metacriticId}/`;

const spiderVerseData = (imdb = "") =>
  makeData({
    info: { ...makeData().info, imdb },
    subjectId,
    title: {
      full: "蜘蛛侠：平行宇宙 Spider-Man: Into the Spider-Verse",
      original: "Spider-Man: Into the Spider-Verse",
      primary: "蜘蛛侠：平行宇宙",
      seasonLabel: "",
    },
    year: "2018",
  });

const saveSnapshot = (now: number, age: number): void => {
  const snapshot = {
    audience: null,
    critics: { displayScore: "87", reviewCount: 50, score: 87 },
    fetchedAt: now - age,
    object: {
      kind: "movie",
      metacriticId,
      season: null,
      seriesId: null,
      seriesMetacriticId: null,
      subjectId,
    },
    sourceUrl,
    stale: false,
  };
  localStorage.setItem(
    snapshotStorageKey,
    JSON.stringify({
      [JSON.stringify([subjectId, "movie", null, null, null, metacriticId])]:
        snapshot,
    })
  );
};

const mockLookupFailure = (): void => {
  mockNetwork((url) =>
    url.includes("wikidata.org/w/api.php")
      ? "timeout"
      : { body: "", status: 404 }
  );
};

describe("SubjectPageRuntime Metacritic snapshot", () => {
  setupSubjectRuntimeHooks();

  it.each([
    { age: 6 * 24 * 60 * 60 * 1000, staleLabel: undefined },
    { age: 7 * 24 * 60 * 60 * 1000, staleLabel: "旧评分" },
    { age: 30 * 24 * 60 * 60 * 1000, staleLabel: "旧评分" },
  ])(
    "shows a verified score through day 30 (age=$age)",
    async ({ age, staleLabel }) => {
      const now = Date.UTC(2026, 10, 16);
      vi.spyOn(Date, "now").mockReturnValue(now);
      saveSnapshot(now, age);
      mockLookupFailure();
      const root = renderIntoRoot(
        <SubjectPageRuntime data={spiderVerseData()} doc={document} />
      );

      await vi.waitFor(() =>
        expect(
          root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
            ?.textContent
        ).toBe("87")
      );
      expect(root.querySelector(".atv-mc-stale")?.textContent).toBe(staleLabel);
      render(null, root);
    }
  );

  it.each([-60 * 60 * 1000, 31 * 24 * 60 * 60 * 1000])(
    "hides future or expired snapshots (age=%s)",
    async (age) => {
      const now = Date.UTC(2026, 10, 16);
      vi.spyOn(Date, "now").mockReturnValue(now);
      saveSnapshot(now, age);
      mockLookupFailure();
      const root = renderIntoRoot(
        <SubjectPageRuntime data={spiderVerseData()} doc={document} />
      );

      await vi.waitFor(() =>
        expect(root.querySelector(".atv-rating-panel-mc")).toBeNull()
      );
      render(null, root);
    }
  );

  it("retains a stale score when cached-target revalidation has no mapping", async () => {
    const imdbId = "tt4633694";
    const now = Date.UTC(2026, 10, 16);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const target = {
      kind: "movie",
      identityReferences: { creators: [], directors: [] },
      metacriticId,
      season: null,
      seriesId: null,
      seriesMetacriticId: null,
      status: "matched",
    };
    const contextCacheKey = JSON.stringify([subjectId, imdbId, "movie", null]);
    localStorage.setItem(
      "dp:metacritic-targets:v4",
      JSON.stringify([
        [
          contextCacheKey,
          {
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
            value: {
              status: "resolved",
              target,
              verifiedAt: now - 25 * 60 * 60 * 1000,
            },
          },
        ],
      ])
    );
    saveSnapshot(now, 8 * 24 * 60 * 60 * 1000);
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        return { body: JSON.stringify({ query: { search: [] } }) };
      }
      if (url === sourceUrl) {
        return "timeout";
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={spiderVerseData(imdbId)} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-mc-stale")?.textContent).toBe("旧评分")
    );
    expect(
      root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
        ?.textContent
    ).toBe("87");
    await vi.waitFor(() =>
      expect(localStorage.getItem(snapshotStorageKey)).not.toBeNull()
    );
  });
});
