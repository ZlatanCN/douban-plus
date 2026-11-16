import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import chernobylMiniseries from "../fixtures/rotten-tomatoes/chernobyl-miniseries.html?raw";
import chernobylSeries from "../fixtures/rotten-tomatoes/chernobyl-series.html?raw";
import queensGambitMiniseries from "../fixtures/rotten-tomatoes/queens-gambit-miniseries.html?raw";
import queensGambitSeries from "../fixtures/rotten-tomatoes/queens-gambit-series.html?raw";
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

const chernobylSeasonData = () =>
  makeData({
    info: {
      ...makeData().info,
      director: [{ text: "Johan Renck", href: "" }],
      selectedSeason: "Season 1",
    },
    isTV: true,
    subjectId: "30140083",
    title: {
      full: "切尔诺贝利",
      original: "Chernobyl",
      primary: "切尔诺贝利",
      seasonLabel: "Season 1",
    },
    year: "2019",
  });

const mockSeasonNetwork = (input: {
  entityId: string;
  rtId: string;
  seasonPage: string;
  seriesPage: string;
  subjectId: string;
}): void => {
  mockNetwork((url) => {
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({
            query: { search: [{ title: input.entityId }] },
          }),
        };
      }
      return {
        body: JSON.stringify({
          entities: {
            [input.entityId]: {
              claims: {
                P1258: [
                  {
                    mainsnak: {
                      datavalue: { value: input.rtId },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
                P31: [
                  {
                    mainsnak: {
                      datavalue: { value: { id: "Q5398426" } },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
                P4529: [
                  {
                    mainsnak: {
                      datavalue: { value: input.subjectId },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
              },
              id: input.entityId,
            },
          },
        }),
      };
    }
    const seriesUrl = `https://www.rottentomatoes.com/${input.rtId}`;
    if (url === seriesUrl) {
      return { body: input.seriesPage };
    }
    if (url === `${seriesUrl}/s01`) {
      return { body: input.seasonPage };
    }
    return { body: "", status: 404 };
  });
};

const queensGambitSeasonData = () =>
  makeData({
    info: {
      ...makeData().info,
      selectedSeason: "Season 1",
    },
    isTV: true,
    subjectId: "30190066",
    title: {
      full: "后翼弃兵",
      original: "The Queen's Gambit",
      primary: "后翼弃兵",
      seasonLabel: "Season 1",
    },
    year: "2020",
  });

describe("subject runtime RT source season links", () => {
  setupSubjectRuntimeHooks();

  it("uses a confirmed series page's Miniseries season link when Wikidata has no season mapping", async () => {
    mockSeasonNetwork({
      entityId: "Q501",
      rtId: "tv/chernobyl",
      seasonPage: chernobylMiniseries,
      seriesPage: chernobylSeries,
      subjectId: "30140083",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={chernobylSeasonData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["95%", "97%"]);
    });

    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/tv/chernobyl/s01"
    );
  });

  it("does not resolve a season after its explicit source link is removed", async () => {
    const seriesPageWithoutSeasonEvidence = chernobylSeries
      .replace(/"containsSeason":\s*\[[\s\S]*?\]/u, '"containsSeason": []')
      .replace(/<tile-season\b[^>]*>[\s\S]*?<\/tile-season>/u, "");
    mockSeasonNetwork({
      entityId: "Q501",
      rtId: "tv/chernobyl",
      seasonPage: chernobylMiniseries,
      seriesPage: seriesPageWithoutSeasonEvidence,
      subjectId: "30140083",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={chernobylSeasonData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("uses the source season tile when structured season links are absent", async () => {
    const seriesPageWithoutStructuredSeason = chernobylSeries.replace(
      /"containsSeason":\s*\[[\s\S]*?\]/u,
      '"containsSeason": []'
    );
    mockSeasonNetwork({
      entityId: "Q501",
      rtId: "tv/chernobyl",
      seasonPage: chernobylMiniseries,
      seriesPage: seriesPageWithoutStructuredSeason,
      subjectId: "30140083",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={chernobylSeasonData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["95%", "97%"]);
    });
  });

  it("uses the explicit parent link to identify Queen's Gambit's Miniseries page as season one", async () => {
    mockSeasonNetwork({
      entityId: "Q502",
      rtId: "tv/the_queens_gambit",
      seasonPage: queensGambitMiniseries,
      seriesPage: queensGambitSeries,
      subjectId: "30190066",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={queensGambitSeasonData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["96%", "94%"]);
    });
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/tv/the_queens_gambit/s01"
    );
  });
});
