/* ── buildRtRating — Unit Tests ─────────────────────────── */
/* Tests buildRtRating() from src/build/rt-rating.ts        */

import { describe, it, expect } from "vitest";

import { buildRtRating } from "../../src/build";
import type { RtRating } from "../../src/types";

/* ═══════════════════════════════════════════════════════════ */
/* ── buildRtRating ──────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("buildRtRating", () => {
  it("returns a DIV with class atv-rating-panel-rt (t1)", () => {
    const el = buildRtRating(null);

    expect(el.tagName).toBe("DIV");
    expect(el.classList.contains("atv-rating-panel-rt")).toBe(true);
  });

  it("renders skeleton (.atv-rating-panel-skeleton) when rating is null (t2)", () => {
    const el = buildRtRating(null);
    const skeleton = el.querySelector(".atv-rating-panel-skeleton");

    expect(skeleton).not.toBeNull();
  });

  it("has is-loading class when rating is null (t3)", () => {
    const el = buildRtRating(null);

    expect(el.classList.contains("is-loading")).toBe(true);
    expect(el.classList.contains("is-loaded")).toBe(false);
  });

  it("renders score percentage and count when rating is provided (t4)", () => {
    const rating: RtRating = { count: 1200, score: 94 };
    const el = buildRtRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score).not.toBeNull();
    expect(score?.textContent).toBe("94%");

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count).not.toBeNull();
    expect(count?.textContent).toContain("1,200");
  });

  it("score is shown as integer percentage (t5)", () => {
    const rating: RtRating = { count: 500, score: 7 };
    const el = buildRtRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score?.textContent).toBe("7%");
  });

  it("count uses 评论 suffix with toLocaleString formatting (t6)", () => {
    const rating: RtRating = { count: 2800, score: 85 };
    const el = buildRtRating(rating);

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count?.textContent).toContain("2,800");
    expect(count?.textContent).toContain("评论");
  });

  it("contains LOGO_RT SVG badge when rating is provided (t7)", () => {
    const rating: RtRating = { count: 100_000, score: 80 };
    const el = buildRtRating(rating);

    const logo = el.querySelector(
      '[aria-label="Rotten Tomatoes"]'
    ) as HTMLElement;
    expect(logo).not.toBeNull();
  });

  it("has is-loaded class when rating is provided (t8)", () => {
    const rating: RtRating = { count: 100_000, score: 80 };
    const el = buildRtRating(rating);

    expect(el.classList.contains("is-loaded")).toBe(true);
    expect(el.classList.contains("is-loading")).toBe(false);
  });

  it("score has correct class for styling (t9)", () => {
    const rating: RtRating = { count: 2_000_000, score: 91 };
    const el = buildRtRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score).not.toBeNull();
  });

  it("renders count label with 评论 prefix (t10)", () => {
    const rating: RtRating = { count: 1_800_000, score: 85 };
    const el = buildRtRating(rating);

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count).not.toBeNull();
    expect(count?.textContent).toContain("评论");
  });

  it("does not render stars (RT has no star rating) (t11)", () => {
    const rating: RtRating = { count: 250_000, score: 85 };
    const el = buildRtRating(rating);

    const stars = el.querySelector(".atv-rating-stars");
    expect(stars).toBeNull();
  });
});
