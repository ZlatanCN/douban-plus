/* ── buildImdbRating — Unit Tests ─────────────────────────── */
/* Tests buildImdbRating() from src/build/imdb-rating.ts       */

import { describe, it, expect } from "vitest";

import { buildImdbRating } from "../../src/build";
import type { ImdbRating } from "../../src/types";

/* ═══════════════════════════════════════════════════════════ */
/* ── buildImdbRating ────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("buildImdbRating", () => {
  it("returns a DIV with class atv-rating-panel-imdb (t1)", () => {
    const el = buildImdbRating(null);

    expect(el.tagName).toBe("DIV");
    expect(el.classList.contains("atv-rating-panel-imdb")).toBe(true);
  });

  it("renders skeleton (.atv-rating-panel-skeleton) when rating is null (t2)", () => {
    const el = buildImdbRating(null);
    const skeleton = el.querySelector(".atv-rating-panel-skeleton");

    expect(skeleton).not.toBeNull();
  });

  it("has is-loading class when rating is null (t3)", () => {
    const el = buildImdbRating(null);

    expect(el.classList.contains("is-loading")).toBe(true);
    expect(el.classList.contains("is-loaded")).toBe(false);
  });

  it("renders score and count when rating is provided (t4)", () => {
    const rating: ImdbRating = { count: 1_200_000, score: 8.5 };
    const el = buildImdbRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score).not.toBeNull();
    expect(score?.textContent).toBe("8.5");

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count).not.toBeNull();
    // Should include the localized vote count
    expect(count?.textContent).toContain("1,200,000");
  });

  it("score is formatted to one decimal place (t5)", () => {
    const rating: ImdbRating = { count: 500_000, score: 7 };
    const el = buildImdbRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score?.textContent).toBe("7.0");
  });

  it("count uses 评价 prefix with toLocaleString formatting (t6)", () => {
    const rating: ImdbRating = { count: 2_800_000, score: 9.3 };
    const el = buildImdbRating(rating);

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count?.textContent).toContain("2,800,000");
    expect(count?.textContent).toContain("评价");
  });

  it("contains LOGO_IMDB SVG badge when rating is provided (t7)", () => {
    const rating: ImdbRating = { count: 100_000, score: 8 };
    const el = buildImdbRating(rating);

    // The logo SVG has aria-label="IMDb"
    const logo = el.querySelector('[aria-label="IMDb"]') as HTMLElement;
    expect(logo).not.toBeNull();
  });

  it("has is-loaded class when rating is provided (t8)", () => {
    const rating: ImdbRating = { count: 100_000, score: 8 };
    const el = buildImdbRating(rating);

    expect(el.classList.contains("is-loaded")).toBe(true);
    expect(el.classList.contains("is-loading")).toBe(false);
  });

  it("score has correct class for styling (t9)", () => {
    const rating: ImdbRating = { count: 2_000_000, score: 9.1 };
    const el = buildImdbRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score).not.toBeNull();
  });

  it("renders count label with 评价 prefix (t10)", () => {
    const rating: ImdbRating = { count: 1_800_000, score: 8.5 };
    const el = buildImdbRating(rating);

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count).not.toBeNull();
    expect(count?.textContent).toContain("评价");
  });

  it("renders stars alongside score and count (t11)", () => {
    const rating: ImdbRating = { count: 250_000, score: 8.5 };
    const el = buildImdbRating(rating);

    const stars = el.querySelector(".atv-rating-stars") as HTMLElement;
    expect(stars).not.toBeNull();
    expect(stars?.querySelectorAll("svg").length).toBe(5);
  });
});
