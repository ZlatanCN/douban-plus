/* ── fetchMcRating — Unit Tests ─────────────────────────── */
/* Tests for src/api/metacritic.ts. Mocks gmGet so no real HTTP. */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGmGet = vi.hoisted(() =>
  vi.fn<(url: string, referer?: string) => Promise<string>>()
);

vi.mock(import("../../src/utils/request"), () => ({
  gmGet: mockGmGet,
}));

// Import after mocking
const { fetchMcRating } = await import("../../src/api/metacritic");

/* ── Helpers ──────────────────────────────────────────── */

const makeMcPage = (score: number, count: number): string =>
  `<!DOCTYPE html><html><head><script type="application/ld+json">{"aggregateRating":{"@type":"AggregateRating","ratingValue":${score},"reviewCount":${count},"bestRating":100,"worstRating":0}}</script></head><body></body></html>`;

const makeMcPageNoJsonLd = (): string =>
  "<html><body><h1>No data</h1></body></html>";

const makeMcPageMissingRating = (): string =>
  '<html><head><script type="application/ld+json">{"name":"Test"}</script></head><body></body></html>';

/* ── Suite ────────────────────────────────────────────── */

describe("fetchMcRating", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  /* ── Slug construction ──────────────────────────── */

  it("converts title to correct MC hyphen slug (t1)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(82, 22));

    await fetchMcRating("The Shawshank Redemption", false);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.metacritic.com/movie/the-shawshank-redemption",
      "https://www.metacritic.com/"
    );
  });

  it("uses tv path with season-1 suffix for isTV=true (t2)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(95, 20));

    await fetchMcRating("Game of Thrones", true, 1);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.metacritic.com/tv/game-of-thrones/season-1",
      "https://www.metacritic.com/"
    );
  });

  it("removes diacritics from title slug (t3)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(80, 10));

    await fetchMcRating("Pokémon", false);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.metacritic.com/movie/pokemon",
      "https://www.metacritic.com/"
    );
  });

  /* ── Happy path ─────────────────────────────────── */

  it("returns McRating with score and count from valid JSON-LD (t4)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(82, 22));

    const result = await fetchMcRating("The Shawshank Redemption", false);

    expect(result).toStrictEqual({ reviewCount: 22, score: 82 });
  });

  it("sends correct referer header (t5)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(82, 22));

    await fetchMcRating("The Shawshank Redemption", false);

    expect(mockGmGet).toHaveBeenCalledWith(
      expect.any(String),
      "https://www.metacritic.com/"
    );
  });

  /* ── Error / edge cases ─────────────────────────── */

  it("returns null for empty title (t6)", async () => {
    const result = await fetchMcRating("", false);

    expect(result).toBeNull();
    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("returns null when gmGet rejects (t7)", async () => {
    mockGmGet.mockRejectedValue(new Error("Network error"));

    const result = await fetchMcRating("Nonexistent Movie", false);

    expect(result).toBeNull();
  });

  it("returns null when page has no JSON-LD (t8)", async () => {
    mockGmGet.mockResolvedValue(makeMcPageNoJsonLd());

    const result = await fetchMcRating("No Data Movie", false);

    expect(result).toBeNull();
  });

  it("returns null when aggregateRating is missing (t9)", async () => {
    mockGmGet.mockResolvedValue(makeMcPageMissingRating());

    const result = await fetchMcRating("No Rating Movie", false);

    expect(result).toBeNull();
  });

  it("returns cached value without HTTP request (t10)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(82, 22));

    // First call — fetches and caches
    const first = await fetchMcRating("The Shawshank Redemption", false);
    expect(first).toStrictEqual({ reviewCount: 22, score: 82 });
    expect(mockGmGet).toHaveBeenCalledOnce();

    // Second call — should use cache
    mockGmGet.mockClear();
    const second = await fetchMcRating("The Shawshank Redemption", false);
    expect(second).toStrictEqual({ reviewCount: 22, score: 82 });
    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("skips expired cache entries (t11)", async () => {
    // Set expired entry directly in localStorage
    const expiredKey = "dp:metacritic-cache";
    const stale = [
      [
        "the-shawshank-redemption",
        { expiresAt: Date.now() - 1000, value: { reviewCount: 5, score: 50 } },
      ],
    ];
    localStorage.setItem(expiredKey, JSON.stringify(stale));

    mockGmGet.mockResolvedValue(makeMcPage(82, 22));

    const result = await fetchMcRating("The Shawshank Redemption", false);

    // Should re-fetch since cache is expired
    expect(result).toStrictEqual({ reviewCount: 22, score: 82 });
    expect(mockGmGet).toHaveBeenCalledOnce();
  });

  it("returns null when ratingValue is not a number (t12)", async () => {
    const invalidHtml =
      '<html><head><script type="application/ld+json">{"aggregateRating":{"ratingValue":"N/A","reviewCount":10}}</script></head><body></body></html>';
    mockGmGet.mockResolvedValue(invalidHtml);

    const result = await fetchMcRating("Invalid Movie", false);

    expect(result).toBeNull();
  });

  /* ── URL fallback behavior ──────────────────────── */

  it("uses season-suffixed URL for TV with season (t13)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(80, 10));

    await fetchMcRating("Breaking Bad", true, 5);

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.metacritic.com/tv/breaking-bad/season-5",
      "https://www.metacritic.com/"
    );
  });

  it("includes year-suffixed URL as first attempt for movie with year (t14)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(69, 43));

    await fetchMcRating("True Grit", false, undefined, "2010");

    expect(mockGmGet).toHaveBeenCalledWith(
      "https://www.metacritic.com/movie/true-grit-2010",
      "https://www.metacritic.com/"
    );
  });

  it("falls back to plain slug when year-suffixed URL fails (t15)", async () => {
    mockGmGet
      // year-suffixed fails
      .mockRejectedValueOnce(new Error("404"))
      // plain slug succeeds
      .mockResolvedValueOnce(makeMcPage(69, 43));

    const result = await fetchMcRating("True Grit", false, undefined, "2010");

    expect(result).toStrictEqual({ reviewCount: 43, score: 69 });
    expect(mockGmGet).toHaveBeenCalledTimes(2);
    expect(mockGmGet).toHaveBeenNthCalledWith(
      1,
      "https://www.metacritic.com/movie/true-grit-2010",
      "https://www.metacritic.com/"
    );
    expect(mockGmGet).toHaveBeenNthCalledWith(
      2,
      "https://www.metacritic.com/movie/true-grit",
      "https://www.metacritic.com/"
    );
  });

  it("uses year-suffixed slug as first attempt for TV with year, falls back to bare slug (t16)", async () => {
    mockGmGet
      // year-suffixed succeeds
      .mockResolvedValueOnce(makeMcPage(90, 15));

    await fetchMcRating("House of Cards", true, undefined, "2013");

    expect(mockGmGet).toHaveBeenNthCalledWith(
      1,
      "https://www.metacritic.com/tv/house-of-cards-2013",
      "https://www.metacritic.com/"
    );
  });

  it("falls back to bare slug for TV when year-suffixed URL fails (t16b)", async () => {
    mockGmGet
      // year-suffixed fails
      .mockRejectedValueOnce(new Error("404"))
      // bare slug succeeds
      .mockResolvedValueOnce(makeMcPage(90, 15));

    const result = await fetchMcRating(
      "House of Cards",
      true,
      undefined,
      "2013"
    );

    expect(result).toStrictEqual({ reviewCount: 15, score: 90 });
    expect(mockGmGet).toHaveBeenCalledTimes(2);
    expect(mockGmGet).toHaveBeenNthCalledWith(
      1,
      "https://www.metacritic.com/tv/house-of-cards-2013",
      "https://www.metacritic.com/"
    );
    expect(mockGmGet).toHaveBeenNthCalledWith(
      2,
      "https://www.metacritic.com/tv/house-of-cards",
      "https://www.metacritic.com/"
    );
  });

  /* ── Real data parsing ──────────────────────────── */

  it("parses a realistic MC JSON-LD (t17)", async () => {
    const realisticHtml = `<!DOCTYPE html><html><head>
<script type="application/ld+json">{"@context":"http://schema.org","@type":"Movie","name":"The Shawshank Redemption","aggregateRating":{"@type":"AggregateRating","ratingValue":82,"reviewCount":22,"bestRating":100,"worstRating":0}}</script>
</head><body></body></html>`;
    mockGmGet.mockResolvedValue(realisticHtml);

    const result = await fetchMcRating("The Shawshank Redemption", false);

    expect(result).toStrictEqual({ reviewCount: 22, score: 82 });
  });

  /* ── Slug format ────────────────────────────────── */

  it("slug uses hyphens, not underscores (t18)", async () => {
    mockGmGet.mockResolvedValue(makeMcPage(80, 10));

    await fetchMcRating("Spider-Man: Far From Home", false);

    // Should use hyphens: spider-man-far-from-home
    // NOT underscores: spider_man_far_from_home (RT style)
    const url = mockGmGet.mock.calls[0][0] as string;
    expect(url).not.toContain("_");
    expect(url).toContain("spider-man");
  });
});
