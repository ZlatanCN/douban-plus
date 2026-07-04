/* ── buildRtRating — Unit Tests ─────────────────────────── */
/* Tests buildRtRating() from src/build/rt-rating.ts        */

import { describe, it, expect } from "vitest";

import { buildRtRating } from "../../src/build";
import type { RtRating } from "../../src/types";

/* ═══════════════════════════════════════════════════════════ */
/* ── buildRtRating ──────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("buildRtRating", () => {
  /* ── Skeleton / null behavior ──────────────────── */

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

  /* ── Dual-score rendering ──────────────────────── */

  it("renders two score columns with correct percentages (t4)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const values = el.querySelectorAll(
      ".atv-rt-score-value"
    ) as NodeListOf<HTMLElement>;
    expect(values.length).toBe(2);
    expect(values[0]?.textContent).toBe("94%");
    expect(values[1]?.textContent).toBe("76%");
  });

  it("renders tomato icon in critics column (t5)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const criticsLabel = el.querySelector(
      ".atv-rt-label-item.is-critics .atv-rt-score-icon svg"
    );
    expect(criticsLabel).not.toBeNull();
    // Circle icon for critics
    expect(criticsLabel?.querySelector("circle")).not.toBeNull();
  });

  it("renders popcorn icon in audience column (t6)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const audienceLabel = el.querySelector(
      ".atv-rt-label-item.is-audience .atv-rt-score-icon svg"
    );
    expect(audienceLabel).not.toBeNull();
    // Diamond icon for audience
    expect(audienceLabel?.querySelector("path")).not.toBeNull();
  });

  it("renders 影评人 and 观众 labels (t7)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const labels = el.querySelectorAll(
      ".atv-rt-score-label"
    ) as NodeListOf<HTMLElement>;
    expect(labels.length).toBe(2);
    expect(labels[0]?.textContent).toBe("影评人");
    expect(labels[1]?.textContent).toBe("观众");
  });

  it("applies is-fresh class for score >= 60 (t8)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const items = el.querySelectorAll(
      ".atv-rt-label-item"
    ) as NodeListOf<HTMLElement>;
    expect(items[0]?.classList.contains("is-fresh")).toBe(true);
    expect(items[0]?.classList.contains("is-rotten")).toBe(false);
    expect(items[1]?.classList.contains("is-fresh")).toBe(true);
    expect(items[1]?.classList.contains("is-rotten")).toBe(false);
  });

  it("applies is-rotten class for score < 60 (t9)", () => {
    const rating: RtRating = {
      audienceCount: 500,
      audienceScore: 30,
      criticsCount: 100,
      criticsScore: 45,
    };
    const el = buildRtRating(rating);

    const items = el.querySelectorAll(
      ".atv-rt-label-item"
    ) as NodeListOf<HTMLElement>;
    expect(items[0]?.classList.contains("is-rotten")).toBe(true);
    expect(items[0]?.classList.contains("is-fresh")).toBe(false);
    expect(items[1]?.classList.contains("is-rotten")).toBe(true);
    expect(items[1]?.classList.contains("is-fresh")).toBe(false);
  });

  it("applies independent freshness per column (t10)", () => {
    const rating: RtRating = {
      audienceCount: 500,
      audienceScore: 88,
      criticsCount: 100,
      criticsScore: 45,
    };
    const el = buildRtRating(rating);

    const items = el.querySelectorAll(
      ".atv-rt-label-item"
    ) as NodeListOf<HTMLElement>;
    expect(items[0]?.classList.contains("is-rotten")).toBe(true);
    expect(items[0]?.classList.contains("is-fresh")).toBe(false);
    expect(items[1]?.classList.contains("is-fresh")).toBe(true);
    expect(items[1]?.classList.contains("is-rotten")).toBe(false);
  });

  it("renders divider between columns (t11)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const divider = el.querySelector(".atv-rt-divider");
    expect(divider).not.toBeNull();
    // Divider sits inside the score row
    const scoreRow = el.querySelector(".atv-rt-score-row");
    expect(scoreRow?.children[1]?.classList.contains("atv-rt-divider")).toBe(
      true
    );
  });

  /* ── Count / detail section ────────────────────── */

  it("count row uses 1fr auto 1fr grid with split values (t12)", () => {
    const rating: RtRating = {
      audienceCount: 50_000,
      audienceScore: 76,
      criticsCount: 300,
      criticsScore: 94,
    };
    const el = buildRtRating(rating);

    const values = el.querySelectorAll(
      ".atv-rt-count-value"
    ) as NodeListOf<HTMLElement>;
    expect(values.length).toBe(2);
    expect(values[0]?.textContent).toContain("评价");
    expect(values[0]?.textContent).toContain("300");
    expect(values[1]?.textContent).toContain("评价");
    expect(values[1]?.textContent).toContain("50,000");
  });

  it("count values use toLocaleString formatting (t13)", () => {
    const rating: RtRating = {
      audienceCount: 1_800_000,
      audienceScore: 72,
      criticsCount: 2800,
      criticsScore: 85,
    };
    const el = buildRtRating(rating);

    const values = el.querySelectorAll(
      ".atv-rt-count-value"
    ) as NodeListOf<HTMLElement>;
    expect(values[0]?.textContent).toContain("评价");
    expect(values[0]?.textContent).toContain("2,800");
    expect(values[1]?.textContent).toContain("评价");
    expect(values[1]?.textContent).toContain("1,800,000");
  });

  /* ── Logo / class / structure ──────────────────── */

  it("contains LOGO_RT SVG badge when rating is provided (t14)", () => {
    const rating: RtRating = {
      audienceCount: 500_000,
      audienceScore: 70,
      criticsCount: 100_000,
      criticsScore: 80,
    };
    const el = buildRtRating(rating);

    const logo = el.querySelector(
      '[aria-label="Rotten Tomatoes"]'
    ) as HTMLElement;
    expect(logo).not.toBeNull();
  });

  it("has is-loaded class when rating is provided (t15)", () => {
    const rating: RtRating = {
      audienceCount: 500_000,
      audienceScore: 70,
      criticsCount: 100_000,
      criticsScore: 80,
    };
    const el = buildRtRating(rating);

    expect(el.classList.contains("is-loaded")).toBe(true);
    expect(el.classList.contains("is-loading")).toBe(false);
  });

  it("does not render stars (RT has no star rating) (t16)", () => {
    const rating: RtRating = {
      audienceCount: 1_000_000,
      audienceScore: 80,
      criticsCount: 250_000,
      criticsScore: 85,
    };
    const el = buildRtRating(rating);

    const stars = el.querySelector(".atv-rating-stars");
    expect(stars).toBeNull();
  });

  it("renders score as integer percentage (t17)", () => {
    const rating: RtRating = {
      audienceCount: 1000,
      audienceScore: 3,
      criticsCount: 500,
      criticsScore: 7,
    };
    const el = buildRtRating(rating);

    const values = el.querySelectorAll(
      ".atv-rt-score-value"
    ) as NodeListOf<HTMLElement>;
    expect(values[0]?.textContent).toBe("7%");
    expect(values[1]?.textContent).toBe("3%");
  });
});
