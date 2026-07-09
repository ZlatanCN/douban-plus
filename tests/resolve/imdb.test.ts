/* ── resolveImdb — Unit Tests ──────────────────────────── */
/* Tests for src/resolve/imdb.ts. Mocks fetchImdbRating.   */

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { FetchImdbResult } from "@/api/imdb";
import type { ResolutionContext } from "@/resolve/types";

const mockFetchImdbRating = vi.hoisted(() =>
  vi.fn<(imdbId: string, season?: number) => Promise<FetchImdbResult>>()
);

vi.mock(import("../../src/api/imdb"), () => ({
  fetchImdbRating: mockFetchImdbRating,
}));

// Import after mocking
const { resolveImdb } = await import("../../src/resolve/imdb");

/* ── Suite ────────────────────────────────────────────── */

describe("resolveImdb", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /* ── Happy path ─────────────────────────────────── */

  it("delegates to fetchImdbRating when imdbId is present (t1)", async () => {
    mockFetchImdbRating.mockResolvedValue({
      rating: { count: 1_200_000, score: 9.3 },
      title: "The Shawshank Redemption",
    });

    const ctx: ResolutionContext = {
      englishTitle: null,
      imdbId: "tt0111161",
      isTV: false,
    };

    const result = await resolveImdb(ctx);

    expect(mockFetchImdbRating).toHaveBeenCalledWith("tt0111161", undefined);
    expect(result).toStrictEqual({
      rating: { count: 1_200_000, score: 9.3 },
      title: "The Shawshank Redemption",
    });
  });

  it("passes season to fetchImdbRating (t2)", async () => {
    mockFetchImdbRating.mockResolvedValue({
      rating: null,
      title: null,
    });

    const ctx: ResolutionContext = {
      englishTitle: null,
      imdbId: "tt0944947",
      isTV: true,
      season: 5,
    };

    await resolveImdb(ctx);

    expect(mockFetchImdbRating).toHaveBeenCalledWith("tt0944947", 5);
  });

  /* ── No IMDb ID ─────────────────────────────────── */

  it("returns null when imdbId is null (t3)", async () => {
    const ctx: ResolutionContext = {
      englishTitle: null,
      imdbId: null,
      isTV: false,
    };

    const result = await resolveImdb(ctx);

    expect(result).toBeNull();
    expect(mockFetchImdbRating).not.toHaveBeenCalled();
  });

  it("returns null when imdbId is empty string (t4)", async () => {
    const ctx: ResolutionContext = {
      englishTitle: null,
      imdbId: "",
      isTV: false,
    };

    const result = await resolveImdb(ctx);

    expect(result).toBeNull();
    expect(mockFetchImdbRating).not.toHaveBeenCalled();
  });
});
