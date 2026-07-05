/* ── buildMcRating — Unit Tests ──────────────────────────── */
/* Tests buildMcRating() from src/build/mc-rating.ts          */

import { describe, it, expect } from "vitest";

import { buildMcRating } from "../../src/build";
import type { McRating } from "../../src/types";

/* ═══════════════════════════════════════════════════════════ */
/* ── buildMcRating ───────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("buildMcRating", () => {
  it("returns a DIV with class atv-rating-panel-mc (t1)", () => {
    const el = buildMcRating(null);

    expect(el.tagName).toBe("DIV");
    expect(el.classList.contains("atv-rating-panel-mc")).toBe(true);
  });

  it("renders skeleton when rating is null (t2)", () => {
    const el = buildMcRating(null);
    const skeleton = el.querySelector(".atv-rating-panel-skeleton");

    expect(skeleton).not.toBeNull();
  });

  it("has is-loading class when rating is null (t3)", () => {
    const el = buildMcRating(null);

    expect(el.classList.contains("is-loading")).toBe(true);
    expect(el.classList.contains("is-loaded")).toBe(false);
  });

  it("renders score as integer and count when rating is provided (t4)", () => {
    const rating: McRating = { reviewCount: 120, score: 82 };
    const el = buildMcRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score).not.toBeNull();
    expect(score?.textContent).toBe("82");

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count).not.toBeNull();
    // Should include the localized review count
    expect(count?.textContent).toContain("120");
  });

  it("score is formatted as integer, not decimal (t5)", () => {
    const rating: McRating = { reviewCount: 50, score: 80 };
    const el = buildMcRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    // MC score is 0-100 integer, no decimal
    expect(score?.textContent).toBe("80");
    expect(score?.textContent).not.toContain(".");
  });

  it("count uses 评价 prefix with toLocaleString formatting (t6)", () => {
    const rating: McRating = { reviewCount: 1500, score: 75 };
    const el = buildMcRating(rating);

    const count = el.querySelector(".atv-rating-panel-count") as HTMLElement;
    expect(count?.textContent).toContain("1,500");
    expect(count?.textContent).toContain("评价");
  });

  it("contains LOGO_METACRITIC SVG badge when rating is provided (t7)", () => {
    const rating: McRating = { reviewCount: 100, score: 80 };
    const el = buildMcRating(rating);

    const logo = el.querySelector('[aria-label="Metacritic"]') as HTMLElement;
    expect(logo).not.toBeNull();
  });

  it("has is-loaded class when rating is provided (t8)", () => {
    const rating: McRating = { reviewCount: 100, score: 80 };
    const el = buildMcRating(rating);

    expect(el.classList.contains("is-loaded")).toBe(true);
    expect(el.classList.contains("is-loading")).toBe(false);
  });

  it("score has is-high class for score >= 75 (t9)", () => {
    const rating: McRating = { reviewCount: 100, score: 82 };
    const el = buildMcRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score?.classList.contains("is-high")).toBe(true);
    expect(score?.classList.contains("is-medium")).toBe(false);
    expect(score?.classList.contains("is-low")).toBe(false);
  });

  it("score has is-medium class for score 50-74 (t10)", () => {
    const rating: McRating = { reviewCount: 100, score: 60 };
    const el = buildMcRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score?.classList.contains("is-medium")).toBe(true);
    expect(score?.classList.contains("is-high")).toBe(false);
    expect(score?.classList.contains("is-low")).toBe(false);
  });

  it("score has is-low class for score < 50 (t11)", () => {
    const rating: McRating = { reviewCount: 100, score: 35 };
    const el = buildMcRating(rating);

    const score = el.querySelector(".atv-rating-panel-score") as HTMLElement;
    expect(score?.classList.contains("is-low")).toBe(true);
    expect(score?.classList.contains("is-high")).toBe(false);
    expect(score?.classList.contains("is-medium")).toBe(false);
  });

  it("does not render stars (t12)", () => {
    const rating: McRating = { reviewCount: 100, score: 82 };
    const el = buildMcRating(rating);

    const stars = el.querySelector(".atv-rating-stars");
    expect(stars).toBeNull();
  });

  it("renders score bar track + Chinese label in .atv-mc-label-row (t13)", () => {
    const rating: McRating = { reviewCount: 100, score: 82 };
    const el = buildMcRating(rating);

    const row = el.querySelector(".atv-mc-label-row") as HTMLElement;
    expect(row).not.toBeNull();

    const barTrack = row?.querySelector(".atv-mc-bar-track") as HTMLElement;
    expect(barTrack).not.toBeNull();

    const barFill = barTrack?.querySelector(".atv-mc-bar-fill") as HTMLElement;
    expect(barFill).not.toBeNull();
    expect(barFill?.classList.contains("is-high")).toBe(true);

    const label = row?.querySelector(".atv-mc-word-label") as HTMLElement;
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("普遍赞誉");
  });

  it("bar width is capped at 100% for score >= 100 (t14)", () => {
    const rating: McRating = { reviewCount: 0, score: 100 };
    const el = buildMcRating(rating);

    const fill = el.querySelector(".atv-mc-bar-fill") as HTMLElement;
    expect(fill?.style.width).toBe("100%");
  });

  it("bar width is proportional to score (t15)", () => {
    const rating: McRating = { reviewCount: 0, score: 60 };
    const el = buildMcRating(rating);

    const fill = el.querySelector(".atv-mc-bar-fill") as HTMLElement;
    expect(fill?.style.width).toBe("60%");
  });

  it("bar fill has correct color class per score band (t16)", () => {
    const high = buildMcRating({ reviewCount: 0, score: 81 });
    expect(
      high.querySelector(".atv-mc-bar-fill")?.classList.contains("is-high")
    ).toBe(true);

    const mid = buildMcRating({ reviewCount: 0, score: 60 });
    expect(
      mid.querySelector(".atv-mc-bar-fill")?.classList.contains("is-medium")
    ).toBe(true);

    const low = buildMcRating({ reviewCount: 0, score: 20 });
    expect(
      low.querySelector(".atv-mc-bar-fill")?.classList.contains("is-low")
    ).toBe(true);
  });

  it("Chinese label matches each score band (t17)", () => {
    const high = buildMcRating({ reviewCount: 0, score: 81 });
    expect(high.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "普遍赞誉"
    );

    const good = buildMcRating({ reviewCount: 0, score: 61 });
    expect(good.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "大体好评"
    );

    const mixed = buildMcRating({ reviewCount: 0, score: 40 });
    expect(mixed.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "褒贬不一"
    );

    const bad = buildMcRating({ reviewCount: 0, score: 20 });
    expect(bad.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "大体差评"
    );

    const worst = buildMcRating({ reviewCount: 0, score: 0 });
    expect(worst.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "普遍差评"
    );
  });
});
