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

describe("subject runtime season conflicts", () => {
  setupSubjectRuntimeHooks();

  it("does not use a selected season that conflicts with the work title", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        imdb: "tt0944947",
        seasons: "第十季",
        selectedSeason: "10",
      },
      isTV: true,
      title: {
        full: "Game of Thrones 第十一季",
        original: "Game of Thrones Season 11",
        primary: "权力的游戏 第十一季",
        seasonLabel: "第十一季",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-imdb")).toBeNull();
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull();
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(
      requests.some((url) => url.includes("www.rottentomatoes.com"))
    ).toBeFalsy();
    expect(requests).not.toContain("https://graphql.imdb.com/");
  });

  it("does not use an episode IMDb ID as the series rating", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: "tt0944947" },
      isTV: true,
      title: {
        full: "Game of Thrones Episode 1",
        original: "Game of Thrones Episode 1",
        primary: "权力的游戏 第 1 集",
        seasonLabel: "",
      },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-imdb")).toBeNull()
    );
    expect(requests).toStrictEqual([]);
  });

  it("rejects a Wikidata season qualifier that conflicts with the selected season", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
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
                    qualifiers: { P1545: [makeClaim("10")] },
                  },
                ],
              },
            },
          },
        }),
      };
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
      requests.some((url) => url.includes("www.rottentomatoes.com"))
    ).toBeFalsy();
  });

  it("does not use a deprecated RT identifier", async () => {
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
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
                    ...makeClaim("tv/friends/s01"),
                    rank: "deprecated",
                  },
                ],
                P31: [makeClaim({ id: "Q3464665" })],
                P4529: [makeClaim("1393859")],
              },
            },
          },
        }),
      };
    });
    const data = makeData({
      info: { ...makeData().info, seasons: "第1季", selectedSeason: "1" },
      isTV: true,
      subjectId: "1393859",
      title: {
        full: "老友记 第1季",
        original: "Friends Season 1",
        primary: "老友记",
        seasonLabel: "第1季",
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
});
