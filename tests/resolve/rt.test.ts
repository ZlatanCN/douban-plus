/* ── resolveRt — Unit Tests ────────────────────────────── */
/* Tests for src/resolve/rt.ts. Mocks fetchRtRating.       */

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { ResolutionContext } from "@/resolve/types";
import type { RtRating } from "@/types";

const mockFetchRtRating = vi.hoisted(() =>
  vi.fn<
    (
      title: string,
      isTV?: boolean,
      season?: number,
      year?: string
    ) => Promise<RtRating | null>
  >()
);

vi.mock(import("../../src/api/rotten"), () => ({
  fetchRtRating: mockFetchRtRating,
}));

// Import after mocking
const { resolveRt } = await import("../../src/resolve/rt");

/* ── Suite ────────────────────────────────────────────── */

describe("resolveRt", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /* ── Happy path ─────────────────────────────────── */

  it("delegates to fetchRtRating when englishTitle is present (t1)", async () => {
    mockFetchRtRating.mockResolvedValue({
      audienceCount: 173_380,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    });

    const ctx: ResolutionContext = {
      englishTitle: "The Shawshank Redemption",
      imdbId: "tt0111161",
      isTV: false,
    };

    const result = await resolveRt(ctx);

    expect(mockFetchRtRating).toHaveBeenCalledWith(
      "The Shawshank Redemption",
      false,
      undefined,
      undefined
    );
    expect(result).toStrictEqual({
      audienceCount: 173_380,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    });
  });

  it("passes season and year to fetchRtRating (t2)", async () => {
    mockFetchRtRating.mockResolvedValue(null);

    const ctx: ResolutionContext = {
      englishTitle: "Game of Thrones",
      imdbId: "tt0944947",
      isTV: true,
      season: 5,
    };

    await resolveRt(ctx);

    expect(mockFetchRtRating).toHaveBeenCalledWith(
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

    const result = await resolveRt(ctx);

    expect(result).toBeNull();
    expect(mockFetchRtRating).not.toHaveBeenCalled();
  });

  it("returns null when englishTitle is empty string (t4)", async () => {
    const ctx: ResolutionContext = {
      englishTitle: "",
      imdbId: null,
      isTV: false,
    };

    const result = await resolveRt(ctx);

    expect(result).toBeNull();
    expect(mockFetchRtRating).not.toHaveBeenCalled();
  });

  /* ── fetchRtRating returns null ─────────────────── */

  it("returns null when fetchRtRating fails (t5)", async () => {
    mockFetchRtRating.mockResolvedValue(null);

    const ctx: ResolutionContext = {
      englishTitle: "The Shawshank Redemption",
      imdbId: "tt0111161",
      isTV: false,
    };

    const result = await resolveRt(ctx);

    expect(result).toBeNull();
    expect(mockFetchRtRating).toHaveBeenCalledOnce();
  });
});
