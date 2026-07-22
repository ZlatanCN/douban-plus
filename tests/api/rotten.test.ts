/* ── fetchRtRating — Unit Tests ─────────────────────────── */
/* Tests for src/api/rotten.ts. Mocks gmGet so no real HTTP. */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGmGet = vi.hoisted(() =>
  vi.fn<(url: string, referer?: string) => Promise<string>>()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGet: mockGmGet,
}));

// Import after mocking
const { fetchRtRating } = await import("../../src/modules/subject/api/rotten");

/* ── Helpers ──────────────────────────────────────────── */

const makeRtPage = (options?: {
  criticsScore?: string | number;
  audienceScore?: string | number;
  criticsCount?: number;
  audienceCount?: number;
}): string => {
  const cs = options?.criticsScore ?? "94";
  const as = options?.audienceScore ?? "76";
  const cc = options?.criticsCount ?? 0;
  const ac = options?.audienceCount ?? 173_380;
  const score = Math.trunc(Number(as));
  const likedCount = Math.round(ac * (score / 100));
  const notLikedCount = ac - likedCount;
  return `<!DOCTYPE html><html><head></head><body>
<script type="application/json" data-json="reviewsData">{"criticsScore":{"score":"${cs}","certified":true,"scorePercent":"${cs}%","ratingCount":${cc}},"audienceScore":{"score":"${as}","likedCount":${likedCount},"notLikedCount":${notLikedCount}}}</script>
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

  it("returns RtRating with both critics and audience scores (t4)", async () => {
    mockGmGet.mockResolvedValue(
      makeRtPage({
        audienceCount: 173_380,
        audienceScore: "76",
        criticsCount: 300,
        criticsScore: "94",
      })
    );

    const result = await fetchRtRating("The Shawshank Redemption", false);

    expect(result).toStrictEqual({
      audienceCount: 173_380,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    });
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
    expect(mockGmGet).toHaveBeenCalledOnce();

    // Second call — should use cache
    mockGmGet.mockClear();
    const result = await fetchRtRating("The Shawshank Redemption", false);
    expect(result).toStrictEqual({
      audienceCount: 173_380,
      audienceScore: 76,
      criticsCount: 0,
      criticsScore: 94,
    });
    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("skips expired cache entries (t11)", async () => {
    // Seed expired cache entry directly
    const expiredEntry = JSON.stringify([
      [
        "the_shawshank_redemption",
        {
          expiresAt: Date.now() - 1000,
          rating: {
            audienceCount: 200,
            audienceScore: 60,
            criticsCount: 100,
            criticsScore: 50,
          },
        },
      ],
    ]);
    localStorage.setItem("dp:rotten-cache", expiredEntry);

    mockGmGet.mockResolvedValue(
      makeRtPage({ audienceCount: 173_380, criticsScore: "94" })
    );
    const result = await fetchRtRating("The Shawshank Redemption", false);

    expect(result).toStrictEqual({
      audienceCount: 173_380,
      audienceScore: 76,
      criticsCount: 0,
      criticsScore: 94,
    });
    // Fresh fetch
    expect(mockGmGet).toHaveBeenCalledOnce();
  });

  /* ── Edge cases ───────────────────────────────── */

  it("returns null when criticsScore is NaN after parsing (t12)", async () => {
    mockGmGet.mockResolvedValue(
      makeRtPage({ audienceScore: "76", criticsScore: "not-a-number" })
    );

    const result = await fetchRtRating("Invalid Score", false);

    expect(result).toBeNull();
  });

  it("parses both critics and audience scores from reviewsData (t13)", async () => {
    mockGmGet.mockResolvedValue(
      makeRtPage({
        audienceCount: 50_000,
        audienceScore: "88",
        criticsCount: 250,
        criticsScore: "92",
      })
    );

    const result = await fetchRtRating("Test Movie", false);

    expect(result).toStrictEqual({
      audienceCount: 50_000,
      audienceScore: 88,
      criticsCount: 250,
      criticsScore: 92,
    });
  });

  it("returns null when audienceScore is missing (t14)", async () => {
    mockGmGet.mockResolvedValue(
      '<script type="application/json" data-json="reviewsData">{"criticsScore":{"score":"94","ratingCount":100}}</script>'
    );

    const result = await fetchRtRating("Partial Data", false);

    expect(result).toBeNull();
  });

  /* ── Year suffix ────────────────────────────────── */

  it("uses year-suffixed URL when year is provided (t15)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage());

    await fetchRtRating("Pressure", false, undefined, "2026");

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.rottentomatoes.com/m/pressure_2026",
      "https://www.rottentomatoes.com/"
    );
  });

  it("falls back to plain slug when year-suffixed URL fails (t16)", async () => {
    mockGmGet
      .mockRejectedValueOnce(new Error("Not found"))
      .mockResolvedValueOnce(
        makeRtPage({ audienceCount: 173_380, criticsScore: "94" })
      );

    const result = await fetchRtRating("Pressure", false, undefined, "2026");

    expect(mockGmGet).toHaveBeenCalledTimes(2);
    expect(mockGmGet).toHaveBeenNthCalledWith(
      1,
      "https://www.rottentomatoes.com/m/pressure_2026",
      "https://www.rottentomatoes.com/"
    );
    expect(mockGmGet).toHaveBeenNthCalledWith(
      2,
      "https://www.rottentomatoes.com/m/pressure",
      "https://www.rottentomatoes.com/"
    );
    expect(result).toStrictEqual({
      audienceCount: 173_380,
      audienceScore: 76,
      criticsCount: 0,
      criticsScore: 94,
    });
  });

  it("ignores year for TV titles (t17)", async () => {
    mockGmGet.mockResolvedValue(makeRtPage());

    await fetchRtRating("Game of Thrones", true, undefined, "2011");

    expect(mockGmGet).toHaveBeenCalledExactlyOnceWith(
      "https://www.rottentomatoes.com/tv/game_of_thrones",
      "https://www.rottentomatoes.com/"
    );
  });

  /* ── Real data structure (parsing fidelity) ────── */

  it("parses criticsCount from mediaScorecard when reviewsData lacks ratingCount (t18)", async () => {
    // Real RT pages have BOTH scripts, with mediaScorecard spanning multiple
    // lines (newlines between <script> and JSON). reviewsData.criticsScore
    // lacks ratingCount; mediaScorecard has full data including ratingCount.
    const realHtml = [
      "<!DOCTYPE html><html><head></head><body>",
      "<media-scorecard-manager>",
      "<script",
      '  id="media-scorecard-json"',
      '  data-json="mediaScorecard"',
      '  type="application/json"',
      ">",
      // Multiline: newline between <script> and JSON content
      '  {"audienceScore":{"averageRating":"3.6","likedCount":142778,"notLikedCount":24632,"reviewCount":1307885,"score":"85"},"criticsScore":{"ratingCount":209,"score":"83"}}',
      "</script>",
      "</media-scorecard-manager>",
      "<media-audience-reviews-manager>",
      '<script type="application/json" data-json="reviewsData">',
      '  {"audienceScore":{"reviewCount":1307885,"score":"85"},"criticsScore":{"certified":true,"score":"83"}}',
      "</script>",
      "</media-audience-reviews-manager>",
      "</body></html>",
    ].join("\n");
    mockGmGet.mockResolvedValue(realHtml);

    const result = await fetchRtRating("The Matrix", false);

    expect(result).not.toBeNull();
    if (!result) {
      throw new Error("unreachable");
    }
    expect(result.criticsCount).toBe(209);
    expect(result.criticsScore).toBe(83);
    expect(result.audienceScore).toBe(85);
    expect(result.audienceCount).toBe(167_410);
  });
});
