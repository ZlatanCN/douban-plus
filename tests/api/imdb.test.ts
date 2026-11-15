/* ── fetchImdbRating — Unit Tests ───────────────────────── */
/* Tests for src/modules/subject/api/external-ratings/imdb/index.ts. Mocks gmPost so no real HTTP. */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGmPost = vi.hoisted(() =>
  vi.fn<(url: string, body: string, referer?: string) => Promise<string>>()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmPost: mockGmPost,
}));

// Import after mocking
const { fetchImdbRating } =
  await import("../../src/modules/subject/api/external-ratings/imdb");

/* ── Helpers ──────────────────────────────────────────── */

const makeGraphQLSuccess = (
  score: number,
  count: number,
  title = "The Shawshank Redemption",
  series?: { id: string; titleText: string }
): string =>
  JSON.stringify({
    data: {
      title: {
        ratingsSummary: { aggregateRating: score, voteCount: count },
        ...(series
          ? {
              series: {
                series: {
                  id: series.id,
                  titleText: { text: series.titleText },
                },
              },
            }
          : {}),
        titleText: { text: title },
      },
    },
  });

const makeSeasonEpisodes = (
  episodes: { score: number; count: number }[]
): string =>
  JSON.stringify({
    data: {
      title: {
        episodes: {
          episodes: {
            edges: episodes.map(({ score, count }) => ({
              node: {
                ratingsSummary: { aggregateRating: score, voteCount: count },
              },
            })),
          },
        },
      },
    },
  });

/* ── Suite ────────────────────────────────────────────── */

describe("fetchImdbRating", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  /* ── Happy path ────────────────────────────────── */

  it("returns rating object and title when GraphQL POST succeeds (t1)", async () => {
    mockGmPost.mockResolvedValue(
      makeGraphQLSuccess(9.3, 1_200_000, "The Shawshank Redemption")
    );

    const result = await fetchImdbRating("tt0111161");

    expect(result.rating).toStrictEqual({ count: 1_200_000, score: 9.3 });
    expect(result.title).toBe("The Shawshank Redemption");
    expect(result.sourceUrl).toBe("https://www.imdb.com/title/tt0111161/");
  });

  it("sends correct GraphQL request URL and headers (t2a)", async () => {
    mockGmPost.mockResolvedValue(makeGraphQLSuccess(8.5, 500_000));

    await fetchImdbRating("tt0120737");

    expect(mockGmPost).toHaveBeenCalledOnce();
    const [[url, _body, referer]] = mockGmPost.mock.calls;
    expect(url).toBe("https://graphql.imdb.com/");
    expect(referer).toBe("https://www.imdb.com/");
  });

  it("sends correct GraphQL query content and variables (t2b)", async () => {
    mockGmPost.mockResolvedValue(makeGraphQLSuccess(8.5, 500_000));

    await fetchImdbRating("tt0120737");

    const [[_url, body]] = mockGmPost.mock.calls;
    const parsed = JSON.parse(body);
    expect(parsed.query).toContain("GetRating");
    expect(parsed.query).toContain("titleText");
    expect(parsed.query).toContain("aggregateRating");
    expect(parsed.query).toContain("voteCount");
    expect(parsed.variables).toStrictEqual({ id: "tt0120737" });
  });

  /* ── Error handling ────────────────────────────── */

  it("returns null rating and null title when gmPost rejects (t3)", async () => {
    mockGmPost.mockRejectedValue(new Error("Network failure"));

    const result = await fetchImdbRating("tt0111161");

    expect(result.rating).toBeNull();
    expect(result.title).toBeNull();
  });

  it("returns null rating and null title when GraphQL response has errors path (t4)", async () => {
    mockGmPost.mockResolvedValue(
      JSON.stringify({ errors: [{ message: "Not found" }] })
    );

    const result = await fetchImdbRating("tt0111161");

    expect(result.rating).toBeNull();
    expect(result.title).toBeNull();
  });

  it("returns nulls when JSON parsing fails (t5)", async () => {
    mockGmPost.mockResolvedValue("not-json-at-all");

    const result = await fetchImdbRating("tt0111161");

    expect(result.rating).toBeNull();
    expect(result.title).toBeNull();
  });

  /* ── Caching ──────────────────────────────────── */

  it("returns cached value without HTTP request (t6)", async () => {
    // First call — populates cache
    mockGmPost.mockResolvedValue(makeGraphQLSuccess(9.3, 1_200_000));
    await fetchImdbRating("tt0111161");
    expect(mockGmPost).toHaveBeenCalledOnce();

    // Second call — should use cache
    mockGmPost.mockClear();
    const result = await fetchImdbRating("tt0111161");
    expect(result).toStrictEqual({
      rating: { count: 1_200_000, score: 9.3 },
      sourceUrl: "https://www.imdb.com/title/tt0111161/",
      title: "The Shawshank Redemption",
    });
    expect(mockGmPost).not.toHaveBeenCalled();
  });

  it("uses the parent series and only that season's episode ratings", async () => {
    mockGmPost
      .mockResolvedValueOnce(
        makeGraphQLSuccess(9.8, 400, "Episode 1", {
          id: "tt-series",
          titleText: "Example Series",
        })
      )
      .mockResolvedValueOnce(
        makeSeasonEpisodes([
          { count: 100, score: 9 },
          { count: 200, score: 8 },
        ])
      );

    const result = await fetchImdbRating("tt-episode", 2);

    expect(result).toStrictEqual({
      rating: { count: 300, score: 8.3 },
      sourceUrl: "https://www.imdb.com/title/tt-series/episodes/?season=2",
      title: "Example Series",
    });
    expect(mockGmPost).toHaveBeenCalledTimes(2);
    const seasonRequest = mockGmPost.mock.calls[1]?.[1];
    const parsedSeasonRequest = JSON.parse(seasonRequest ?? "{}");
    expect(parsedSeasonRequest.query).toContain("GetSeasonEpisodes");
    expect(parsedSeasonRequest.variables).toStrictEqual({
      id: "tt-series",
      season: "2",
    });
  });

  it("does not reuse a direct title rating for a season request", async () => {
    mockGmPost
      .mockResolvedValueOnce(makeGraphQLSuccess(9.8, 400, "Episode 1"))
      .mockResolvedValueOnce(
        makeGraphQLSuccess(9.8, 400, "Episode 1", {
          id: "tt-series",
          titleText: "Example Series",
        })
      )
      .mockResolvedValueOnce(makeSeasonEpisodes([{ count: 500, score: 8.1 }]));

    await fetchImdbRating("tt-episode");
    const seasonResult = await fetchImdbRating("tt-episode", 2);

    expect(seasonResult).toStrictEqual({
      rating: { count: 500, score: 8.1 },
      sourceUrl: "https://www.imdb.com/title/tt-series/episodes/?season=2",
      title: "Example Series",
    });
    expect(mockGmPost).toHaveBeenCalledTimes(3);
  });

  it("returns no season rating when season episodes are unavailable", async () => {
    mockGmPost
      .mockResolvedValueOnce(
        makeGraphQLSuccess(9.8, 400, "Episode 1", {
          id: "tt-series",
          titleText: "Example Series",
        })
      )
      .mockResolvedValueOnce(makeSeasonEpisodes([]));

    const result = await fetchImdbRating("tt-episode", 2);

    expect(result).toStrictEqual({
      rating: null,
      sourceUrl: "https://www.imdb.com/title/tt-series/episodes/?season=2",
      title: "Example Series",
    });
    expect(mockGmPost).toHaveBeenCalledTimes(2);
  });

  it("does not fall back to the title rating when the season query fails", async () => {
    mockGmPost
      .mockResolvedValueOnce(
        makeGraphQLSuccess(9.8, 400, "Episode 1", {
          id: "tt-series",
          titleText: "Example Series",
        })
      )
      .mockRejectedValueOnce(new Error("Network failure"));

    const result = await fetchImdbRating("tt-episode", 2);

    expect(result).toStrictEqual({
      rating: null,
      sourceUrl: "https://www.imdb.com/title/tt-series/episodes/?season=2",
      title: "Example Series",
    });
    expect(mockGmPost).toHaveBeenCalledTimes(2);
  });

  it("does not reuse a season rating for a direct title request", async () => {
    mockGmPost
      .mockResolvedValueOnce(
        makeGraphQLSuccess(8.2, 200, "Episode 1", {
          id: "tt-series",
          titleText: "Example Series",
        })
      )
      .mockResolvedValueOnce(makeSeasonEpisodes([{ count: 500, score: 8.1 }]))
      .mockResolvedValueOnce(makeGraphQLSuccess(8.2, 200, "Episode 1"));

    await fetchImdbRating("tt-episode", 2);
    const directResult = await fetchImdbRating("tt-episode");

    expect(directResult).toStrictEqual({
      rating: { count: 200, score: 8.2 },
      sourceUrl: "https://www.imdb.com/title/tt-episode/",
      title: "Episode 1",
    });
    expect(mockGmPost).toHaveBeenCalledTimes(3);
  });

  it("skips expired cache entries (t7)", async () => {
    // Seed expired cache entry directly
    const expiredEntry = JSON.stringify([
      [
        "tt0111161",
        {
          expiresAt: Date.now() - 1000,
          rating: { count: 100, score: 5 },
        },
      ],
    ]);
    localStorage.setItem("dp:imdb-cache", expiredEntry);

    mockGmPost.mockResolvedValue(makeGraphQLSuccess(9.3, 1_200_000));
    const result = await fetchImdbRating("tt0111161");

    expect(result).toStrictEqual({
      rating: { count: 1_200_000, score: 9.3 },
      sourceUrl: "https://www.imdb.com/title/tt0111161/",
      title: "The Shawshank Redemption",
    });
    // Fresh fetch (the old cache does not include source URLs).
    expect(mockGmPost).toHaveBeenCalledOnce();
  });

  /* ── Edge cases ───────────────────────────────── */

  it("returns null for empty imdbId (t8)", async () => {
    const result = await fetchImdbRating("");

    expect(result).toStrictEqual({
      rating: null,
      sourceUrl: null,
      title: null,
    });
    expect(mockGmPost).not.toHaveBeenCalled();
  });
});
