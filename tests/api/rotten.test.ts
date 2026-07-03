/* ── fetchRtRating — Unit Tests ─────────────────────────── */
/* Tests for src/api/rotten.ts. Mocks gmGet so no real HTTP. */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGmGet = vi.hoisted(() => vi.fn());

vi.mock("../../src/utils/request", () => ({
  gmGet: mockGmGet,
}));

// Import after mocking
const { fetchRtRating } = await import("../../src/api/rotten");

/* ── Helpers ──────────────────────────────────────────── */

const makeRtPage = (options?: {
  criticsScore?: string | number;
  audienceCount?: number;
}): string => {
  const cs = options?.criticsScore ?? "94";
  const ac = options?.audienceCount ?? 173_380;
  return `<!DOCTYPE html><html><head></head><body>
<script type="application/json" data-json="reviewsData">{"criticsScore":{"score":"${cs}","certified":true,"scorePercent":"${cs}%"},"audienceScore":{"score":"${cs}","reviewCount":${ac}}}</script>
</body></html>`;
};

const makeRtPageNoScript = (): string => "<html><body>No RT data</body></html>";

/* ── Suite ────────────────────────────────────────────── */

describe("fetchRtRating", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  /* ── Slug construction ──────────────────────────── */

  it("converts title to correct RT slug (t1)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage());

    await fetchRtRating("The Shawshank Redemption", false);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.rottentomatoes.com/m/the_shawshank_redemption",
      "https://www.rottentomatoes.com/"
    );
  });

  it("uses tv path for isTV=true (t2)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage());

    await fetchRtRating("Game of Thrones", true);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.rottentomatoes.com/tv/game_of_thrones",
      "https://www.rottentomatoes.com/"
    );
  });

  it("removes diacritics from title slug (t3)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage());

    await fetchRtRating("Pokémon", false);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.rottentomatoes.com/m/pokemon",
      "https://www.rottentomatoes.com/"
    );
  });

  /* ── Happy path ─────────────────────────────────── */

  it("returns RtRating when page parses successfully (t4)", async () => {
    mockGmGet.mockResolvedValue(
      makeRtPage({ audienceCount: 173_380, criticsScore: "94" })
    );

    const result = await fetchRtRating("The Shawshank Redemption", false);

    expect(result).toEqual({ count: 173_380, score: 94 });
  });

  it("sends correct referer header (t5)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage());

    await fetchRtRating("Test Movie", false);

    expect(mockGmGet).toHaveBeenCalledWith(
      expect.any(String),
      "https://www.rottentomatoes.com/"
    );
  });

  /* ── Error handling ────────────────────────────── */

  it("returns null for empty title (t6)", async () => {
    const result = await fetchRtRating("", false);

    expect(result).toBeNull();
    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("returns null when gmGet rejects (t7)", async () => {
    mockGmGet.mockRejectedValue(new Error("Network failure"));

    const result = await fetchRtRating("The Shawshank Redemption", false);

    expect(result).toBeNull();
  });

  it("returns null when page has no reviewsData script (t8)", async () => {
    mockGmGet.mockResolvedValue(makeRtPageNoScript());

    const result = await fetchRtRating("No Ratings Movie", false);

    expect(result).toBeNull();
  });

  it("returns null when criticsScore is missing (t9)", async () => {
    mockGmGet.mockResolvedValue(
      '<script type="application/json" data-json="reviewsData">{"audienceScore":{"score":"94"}}</script>'
    );

    const result = await fetchRtRating("Partial Data", false);

    expect(result).toBeNull();
  });

  /* ── Caching ───────────────────────────────────── */

  it("returns cached value without HTTP request (t10)", async () => {
    // First call — populates cache
    mockGmGet.mockResolvedValue(
      makeRtPage({ audienceCount: 173_380, criticsScore: "94" })
    );
    await fetchRtRating("The Shawshank Redemption", false);
    expect(mockGmGet).toHaveBeenCalledTimes(1);

    // Second call — should use cache
    mockGmGet.mockClear();
    const result = await fetchRtRating("The Shawshank Redemption", false);
    expect(result).toEqual({ count: 173_380, score: 94 });
    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("skips expired cache entries (t11)", async () => {
    // Seed expired cache entry directly
    const expiredEntry = JSON.stringify([
      [
        "the_shawshank_redemption",
        {
          expiresAt: Date.now() - 1000,
          rating: { count: 100, score: 50 },
        },
      ],
    ]);
    localStorage.setItem("dp:rotten-cache", expiredEntry);

    mockGmGet.mockResolvedValue(
      makeRtPage({ audienceCount: 173_380, criticsScore: "94" })
    );
    const result = await fetchRtRating("The Shawshank Redemption", false);

    expect(result).toEqual({ count: 173_380, score: 94 });
    // Fresh fetch
    expect(mockGmGet).toHaveBeenCalledTimes(1);
  });

  /* ── Edge cases ───────────────────────────────── */

  it("returns null when score is NaN after parsing (t12)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage({ criticsScore: "not-a-number" }));

    const result = await fetchRtRating("Invalid Score", false);

    expect(result).toBeNull();
  });
});
