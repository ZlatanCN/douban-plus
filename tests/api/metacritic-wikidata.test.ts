import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGmGetResponse = vi.hoisted(() =>
  vi.fn<
    (
      url: string
    ) => Promise<{ finalUrl: string; responseText: string; status: number }>
  >()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGetResponse: mockGmGetResponse,
}));

const { resolveMetacriticTarget } =
  await import("../../src/modules/subject/api/external-ratings/metacritic/wikidata/resolve");

const makeClaim = (value: string | { id: string }) => ({
  mainsnak: { datavalue: { value }, snaktype: "value" },
  rank: "normal",
});

const makeQualifier = (value: string) => ({
  datavalue: { value },
  snaktype: "value",
});

const televisionSeriesType = "Q5398426";

describe(resolveMetacriticTarget, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("resolves a series IMDb ID through its selected season to the season Metacritic ID", async () => {
    mockGmGetResponse.mockImplementation((url) => {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        const identifier = requestUrl.searchParams.get("srsearch") ?? "";
        const search = identifier.includes("P345=tt0944947")
          ? [{ title: "Q23572" }]
          : [];
        const responseText = JSON.stringify({ query: { search } });
        return Promise.resolve({ finalUrl: url, responseText, status: 200 });
      }

      const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
      const entities: Record<string, unknown> = {};
      if (ids.includes("Q23572")) {
        entities.Q23572 = {
          claims: {
            P1712: [makeClaim("tv/game-of-thrones")],
            P31: [makeClaim({ id: televisionSeriesType })],
            P345: [makeClaim("tt0944947")],
            P527: [
              {
                ...makeClaim({ id: "Q1658029" }),
                qualifiers: { P1545: [makeQualifier("1")] },
              },
            ],
          },
          id: "Q23572",
        };
      }
      if (ids.includes("Q1658029")) {
        entities.Q1658029 = {
          claims: {
            P1545: [makeClaim("1")],
            P1712: [makeClaim("tv/game-of-thrones/season-1")],
            P179: [makeClaim({ id: "Q23572" })],
            P31: [makeClaim({ id: "Q3464665" })],
          },
          id: "Q1658029",
        };
      }
      const responseText = JSON.stringify({ entities });
      return Promise.resolve({ finalUrl: url, responseText, status: 200 });
    });

    const result = await resolveMetacriticTarget(
      {
        imdbId: "tt0944947",
        kind: "season",
        season: 1,
        seasonConflict: false,
        subjectId: "3016187",
        subjectTitle: "权力的游戏 第一季",
        identityEvidence: {
          originalTitle: "Game of Thrones",
          releaseYear: "2011",
          directors: [],
          creators: [],
        },
        unsupportedEpisode: false,
      },
      new AbortController().signal
    );

    expect(result).toStrictEqual({
      complete: true,
      status: "matched",
      target: {
        kind: "season",
        identityReferences: { creators: [], directors: [] },
        metacriticId: "tv/game-of-thrones/season-1",
        season: 1,
        seriesId: "Q23572",
        seriesMetacriticId: "tv/game-of-thrones",
        status: "matched",
      },
    });
  });
});
