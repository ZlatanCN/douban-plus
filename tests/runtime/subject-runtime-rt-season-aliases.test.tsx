import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import chernobylSeries from "../fixtures/rotten-tomatoes/chernobyl-series.html?raw";
import queensGambitMiniseries from "../fixtures/rotten-tomatoes/queens-gambit-miniseries.html?raw";
import severanceSeason2 from "../fixtures/rotten-tomatoes/severance-season-2.html?raw";
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

const seasonData = (input: { original: string; subjectId: string }) =>
  makeData({
    info: {
      ...makeData().info,
      selectedSeason: "Season 1",
    },
    isTV: true,
    subjectId: input.subjectId,
    title: {
      full: input.original,
      original: `${input.original} Season 1`,
      primary: input.original,
      seasonLabel: "Season 1",
    },
    year: "2020",
  });

const mockSeasonRedirect = (input: {
  requestedRtId: string;
  subjectId: string;
  seasonPage: string;
  finalUrl: string;
  seriesPage?: string;
}): void => {
  mockNetwork((url) => {
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({ query: { search: [{ title: "Q9001" }] } }),
        };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q9001: {
              claims: {
                P1258: [makeClaim(input.requestedRtId)],
                P31: [makeClaim({ id: "Q3464665" })],
                P4529: [
                  {
                    ...makeClaim(input.subjectId),
                    qualifiers: { P1545: [makeClaim("1")] },
                  },
                ],
              },
              id: "Q9001",
            },
          },
        }),
      };
    }
    if (url === `https://www.rottentomatoes.com/${input.requestedRtId}`) {
      return { body: input.seasonPage, finalUrl: input.finalUrl };
    }
    if (
      url === "https://www.rottentomatoes.com/tv/chernobyl" &&
      input.seriesPage
    ) {
      return { body: input.seriesPage };
    }
    return { body: "", status: 404 };
  });
};

describe("subject runtime RT season aliases", () => {
  setupSubjectRuntimeHooks();

  it("rejects a Severance season 1 redirect to its season 2 page", async () => {
    mockSeasonRedirect({
      finalUrl: "https://www.rottentomatoes.com/tv/severance/s02",
      requestedRtId: "tv/severance/s01",
      seasonPage: severanceSeason2,
      subjectId: "34885342",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={seasonData({ original: "Severance", subjectId: "34885342" })}
        doc={document}
      />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("rejects a season alias whose confirmed parent is another series", async () => {
    mockSeasonRedirect({
      finalUrl: "https://www.rottentomatoes.com/tv/the_queens_gambit/s01",
      requestedRtId: "tv/chernobyl/s01",
      seasonPage: queensGambitMiniseries,
      seriesPage: chernobylSeries,
      subjectId: "30140083",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={seasonData({ original: "Chernobyl", subjectId: "30140083" })}
        doc={document}
      />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });
});
