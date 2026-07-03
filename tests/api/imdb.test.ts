/* ── fetchImdbRating — Unit Tests ───────────────────────── */
/* Tests for src/api/imdb.ts. Mocks gmPost so no real HTTP.  */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGmPost = vi.hoisted(() => vi.fn());

vi.mock("../../src/utils/request", () => ({
  gmPost: mockGmPost,
}));

// Import after mocking
const { fetchImdbRating } = await import("../../src/api/imdb");

/* ── Helpers ──────────────────────────────────────────── */

const makeGraphQLSuccess = (
  score: number,
  count: number,
  title = "The Shawshank Redemption"
): string =>
  JSON.stringify({
    data: {
      title: {
        ratingsSummary: { aggregateRating: score, voteCount: count },
        titleText: { text: title },
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

    expect(result.rating).toEqual({ count: 1_200_000, score: 9.3 });
    expect(result.title).toBe("The Shawshank Redemption");
  });

  it("sends correct GraphQL query, headers, variables, and includes titleText (t2)", async () => {
    mockGmPost.mockResolvedValue(makeGraphQLSuccess(8.5, 500_000));

    await fetchImdbRating("tt0120737");

    expect(mockGmPost).toHaveBeenCalledTimes(1);
    const [[url, body, referer]] = mockGmPost.mock.calls;
    expect(url).toBe("https://graphql.imdb.com/");
    expect(referer).toBe("https://www.imdb.com/");

    const parsed = JSON.parse(body);
    expect(parsed.query).toContain("GetRating");
    expect(parsed.query).toContain("titleText");
    expect(parsed.query).toContain("aggregateRating");
    expect(parsed.query).toContain("voteCount");
    expect(parsed.variables).toEqual({ id: "tt0120737" });
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
    expect(mockGmPost).toHaveBeenCalledTimes(1);

    // Second call — should use cache
    mockGmPost.mockClear();
    const result = await fetchImdbRating("tt0111161");
    expect(result).toEqual({
      rating: { count: 1_200_000, score: 9.3 },
      title: "The Shawshank Redemption",
    });
    expect(mockGmPost).not.toHaveBeenCalled();
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

    expect(result).toEqual({
      rating: { count: 1_200_000, score: 9.3 },
      title: "The Shawshank Redemption",
    });
    // Fresh fetch (old cache key "dp:imdb-cache" vs current "dp:imdb-cache-v2" — misses on purpose)
    expect(mockGmPost).toHaveBeenCalledTimes(1);
  });

  /* ── Edge cases ───────────────────────────────── */

  it("returns null for empty imdbId (t8)", async () => {
    const result = await fetchImdbRating("");

    expect(result).toEqual({ rating: null, title: null });
    expect(mockGmPost).not.toHaveBeenCalled();
  });
});
