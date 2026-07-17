/* ── buildContext — Unit Tests ──────────────────────────── */
/* Tests for src/resolve/context.ts. buildContext is pure: it takes the
   already-extracted H1 string (no DOM), so fixtures are plain strings. */

import { describe, it, expect } from "vitest";

// Import after mocking
const { buildContext } = await import("../../src/resolve/context");

/* ── Suite ────────────────────────────────────────────── */

describe("buildContext", () => {
  /* ── Movie with English title in H1 ─────────────── */

  it("extracts englishTitle from H1 with trailing year (t1)", () => {
    const h1 = "肖申克的救赎 The Shawshank Redemption (1994)";

    const ctx = buildContext("tt0111161", false, h1);

    expect(ctx.imdbId).toBe("tt0111161");
    expect(ctx.englishTitle).toBe("The Shawshank Redemption");
    expect(ctx.isTV).toBeFalsy();
    expect(ctx.year).toBe("1994");
  });

  it("extracts englishTitle without year suffix (t2)", () => {
    const h1 = "Inception 盗梦空间";

    const ctx = buildContext("tt1375666", false, h1);

    expect(ctx.englishTitle).toBe("Inception");
    expect(ctx.imdbId).toBe("tt1375666");
    expect(ctx.year).toBeUndefined();
  });

  /* ── TV series ─────────────────────────────────── */

  it("extracts season from H1 for TV, year is now included for slug disambiguation (t3)", () => {
    const h1 = "权力的游戏 第五季 Game of Thrones Season 5 (2015)";

    const ctx = buildContext("tt0944947", true, h1);

    expect(ctx.englishTitle).toBe("Game of Thrones");
    expect(ctx.season).toBe(5);
    expect(ctx.isTV).toBeTruthy();
    expect(ctx.year).toBe("2015");
  });

  it("handles TV with no season in H1 (t4)", () => {
    const h1 = "Breaking Bad 绝命毒师";

    const ctx = buildContext("tt0903747", true, h1);

    expect(ctx.englishTitle).toBe("Breaking Bad");
    expect(ctx.season).toBeUndefined();
    expect(ctx.isTV).toBeTruthy();
  });

  /* ── No English title in H1 ────────────────────── */

  it("returns null englishTitle when H1 has no English text (t5)", () => {
    const h1 = "純國產電影 (2005)";

    const ctx = buildContext(null, false, h1);

    expect(ctx.englishTitle).toBeNull();
    expect(ctx.imdbId).toBeNull();
  });

  /* ── Nulls and undefined ───────────────────────── */

  it("allows null imdbId (t6)", () => {
    const h1 = "Test Movie";

    const ctx = buildContext(null, false, h1);

    expect(ctx.imdbId).toBeNull();
    expect(ctx.englishTitle).toBe("Test Movie");
  });

  it("handles empty H1 gracefully (t7)", () => {
    const h1 = "";

    const ctx = buildContext("tt0111161", false, h1);

    expect(ctx.englishTitle).toBeNull();
    expect(ctx.year).toBeUndefined();
    expect(ctx.season).toBeUndefined();
  });
});
