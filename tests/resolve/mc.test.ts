/* ── resolveMc — Unit Tests ────────────────────────────── */
/* Tests for src/resolve/mc.ts. Mocks fetchMcRating.       */

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { ResolutionContext } from "@/resolve/types";
import type { McRating } from "@/types";

const mockFetchMcRating = vi.hoisted(() =>
  vi.fn<
    (
      title: string,
      isTV?: boolean,
      season?: number,
      year?: string
    ) => Promise<McRating | null>
  >()
);

vi.mock(import("../../src/api/metacritic"), () => ({
  fetchMcRating: mockFetchMcRating,
}));

// Import after mocking
const { resolveMc } = await import("../../src/resolve/mc");

/* ── Suite ────────────────────────────────────────────── */

describe("resolveMc", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /* ── Happy path ─────────────────────────────────── */

  it("delegates to fetchMcRating when englishTitle is present (t1)", async () => {
    mockFetchMcRating.mockResolvedValue({
      reviewCount: 22,
      score: 82,
    });

    const ctx: ResolutionContext = {
      englishTitle: "The Shawshank Redemption",
      imdbId: "tt0111161",
      isTV: false,
    };

    const result = await resolveMc(ctx);

    expect(mockFetchMcRating).toHaveBeenCalledWith(
      "The Shawshank Redemption",
      false,
      undefined,
      undefined
    );
    expect(result).toStrictEqual({ reviewCount: 22, score: 82 });
  });

  it("passes season and year to fetchMcRating (t2)", async () => {
    mockFetchMcRating.mockResolvedValue(null);

    const ctx: ResolutionContext = {
      englishTitle: "Game of Thrones",
      imdbId: "tt0944947",
      isTV: true,
      season: 5,
    };

    await resolveMc(ctx);

    expect(mockFetchMcRating).toHaveBeenCalledWith(
      "Game of Thrones",
      true,
      5,
      undefined
    );
  });

  /* ── No English title ───────────────────────────── */

  it("returns null when englishTitle is null (t3)", async () => {
    const ctx: ResolutionContext = {
      englishTitle: null,
      imdbId: null,
      isTV: false,
    };

    const result = await resolveMc(ctx);

    expect(result).toBeNull();
    expect(mockFetchMcRating).not.toHaveBeenCalled();
  });

  it("returns null when englishTitle is empty string (t4)", async () => {
    const ctx: ResolutionContext = {
      englishTitle: "",
      imdbId: null,
      isTV: false,
    };

    const result = await resolveMc(ctx);

    expect(result).toBeNull();
    expect(mockFetchMcRating).not.toHaveBeenCalled();
  });

  /* ── fetchMcRating returns null ─────────────────── */

  it("returns null when fetchMcRating fails (t5)", async () => {
    mockFetchMcRating.mockResolvedValue(null);

    const ctx: ResolutionContext = {
      englishTitle: "The Shawshank Redemption",
      imdbId: "tt0111161",
      isTV: false,
    };

    const result = await resolveMc(ctx);

    expect(result).toBeNull();
    expect(mockFetchMcRating).toHaveBeenCalledOnce();
  });
});
