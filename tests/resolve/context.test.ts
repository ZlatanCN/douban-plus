/* ── buildContext — Unit Tests ──────────────────────────── */
/* Tests for src/resolve/context.ts. Uses test DOM fixtures. */

import { describe, it, expect } from "vitest";

// Import after mocking
const { buildContext } = await import("../../src/resolve/context");

/* ── Helpers ──────────────────────────────────────────── */

const makeDocWithH1 = (h1: string, options?: { imdb?: string }): Document => {
  const doc = document.implementation.createHTMLDocument();
  const h1El = doc.createElement("h1");
  h1El.textContent = h1;
  const content = doc.createElement("div");
  content.id = "content";
  content.append(h1El);
  doc.body.append(content);

  if (options?.imdb) {
    const info = doc.createElement("div");
    info.id = "info";
    const imdbLink = doc.createElement("a");
    imdbLink.href = `https://www.imdb.com/title/${options.imdb}/`;
    const pl = doc.createElement("span");
    pl.className = "pl";
    pl.textContent = "IMDb: ";
    info.append(pl, imdbLink);
    doc.body.append(info);
  }
  return doc;
};

/* ── Suite ────────────────────────────────────────────── */

describe("buildContext", () => {
  /* ── Movie with English title in H1 ─────────────── */

  it("extracts englishTitle from H1 with trailing year (t1)", () => {
    const doc = makeDocWithH1("肖申克的救赎 The Shawshank Redemption (1994)");

    const ctx = buildContext("tt0111161", false, doc);

    expect(ctx.imdbId).toBe("tt0111161");
    expect(ctx.englishTitle).toBe("The Shawshank Redemption");
    expect(ctx.isTV).toBeFalsy();
    expect(ctx.year).toBe("1994");
  });

  it("extracts englishTitle without year suffix (t2)", () => {
    const doc = makeDocWithH1("Inception 盗梦空间");

    const ctx = buildContext("tt1375666", false, doc);

    expect(ctx.englishTitle).toBe("Inception");
    expect(ctx.imdbId).toBe("tt1375666");
    expect(ctx.year).toBeUndefined();
  });

  /* ── TV series ─────────────────────────────────── */

  it("extracts season from H1 for TV and omits year (t3)", () => {
    const doc = makeDocWithH1(
      "权力的游戏 第五季 Game of Thrones Season 5 (2015)"
    );

    const ctx = buildContext("tt0944947", true, doc);

    expect(ctx.englishTitle).toBe("Game of Thrones");
    expect(ctx.season).toBe(5);
    expect(ctx.isTV).toBeTruthy();
    expect(ctx.year).toBeUndefined();
  });

  it("handles TV with no season in H1 (t4)", () => {
    const doc = makeDocWithH1("Breaking Bad 绝命毒师");

    const ctx = buildContext("tt0903747", true, doc);

    expect(ctx.englishTitle).toBe("Breaking Bad");
    expect(ctx.season).toBeUndefined();
    expect(ctx.isTV).toBeTruthy();
  });

  /* ── No English title in H1 ────────────────────── */

  it("returns null englishTitle when H1 has no English text (t5)", () => {
    const doc = makeDocWithH1("純國產電影 (2005)");

    const ctx = buildContext(null, false, doc);

    expect(ctx.englishTitle).toBeNull();
    expect(ctx.imdbId).toBeNull();
  });

  /* ── Nulls and undefined ───────────────────────── */

  it("allows null imdbId (t6)", () => {
    const doc = makeDocWithH1("Test Movie");

    const ctx = buildContext(null, false, doc);

    expect(ctx.imdbId).toBeNull();
    expect(ctx.englishTitle).toBe("Test Movie");
  });

  it("handles empty H1 gracefully (t7)", () => {
    const doc = makeDocWithH1("");

    const ctx = buildContext("tt0111161", false, doc);

    expect(ctx.englishTitle).toBeNull();
    expect(ctx.year).toBeUndefined();
    expect(ctx.season).toBeUndefined();
  });
});
