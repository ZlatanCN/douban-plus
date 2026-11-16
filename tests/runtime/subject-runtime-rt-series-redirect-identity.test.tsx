import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import queensGambitSeries from "../fixtures/rotten-tomatoes/queens-gambit-series.html?raw";
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

const queenSeriesData = () =>
  makeData({
    info: {
      ...makeData().info,
      firstAired: "2020-10-23",
      imdb: "tt10048342",
    },
    isTV: true,
    subjectId: "32579283",
    title: {
      full: "The Queen's Gambit",
      original: "The Queen's Gambit",
      primary: "后翼弃兵",
      seasonLabel: "",
    },
    year: "2020",
  });

const mockQueensSeriesAlias = (includeCreators: boolean): void => {
  mockNetwork((url) => {
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({
            query: { search: [{ title: "Q85808226" }] },
          }),
        };
      }
      if (requestUrl.searchParams.get("props") === "labels|aliases") {
        return {
          body: JSON.stringify({
            entities: {
              Q557208: { labels: { en: { value: "Scott Frank" } } },
              Q2837770: { labels: { en: { value: "Allan Scott" } } },
            },
          }),
        };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q85808226: {
              claims: {
                P1258: [makeClaim("tv/the_queens_gambit_alias")],
                P31: [makeClaim({ id: "Q1259759" })],
                P170: includeCreators
                  ? [
                      makeClaim({ id: "Q557208" }),
                      makeClaim({ id: "Q2837770" }),
                    ]
                  : [],
                P345: [makeClaim("tt10048342")],
                P4529: [makeClaim("32579283")],
              },
              id: "Q85808226",
            },
          },
        }),
      };
    }
    if (url === "https://www.rottentomatoes.com/tv/the_queens_gambit_alias") {
      return {
        body: queensGambitSeries,
        finalUrl: "https://www.rottentomatoes.com/tv/the_queens_gambit",
      };
    }
    return { body: "", status: 404 };
  });
};

describe("subject runtime RT series redirect identity", () => {
  setupSubjectRuntimeHooks();

  it("accepts a series alias from its original title, start year, and mapped creators", async () => {
    mockQueensSeriesAlias(true);
    const root = renderIntoRoot(
      <SubjectPageRuntime data={queenSeriesData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["96%", "94%"]);
    });
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/tv/the_queens_gambit"
    );
  });

  it("rejects a series alias when the mapped Wikidata entity has no creator evidence", async () => {
    mockQueensSeriesAlias(false);
    const root = renderIntoRoot(
      <SubjectPageRuntime data={queenSeriesData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });
});
