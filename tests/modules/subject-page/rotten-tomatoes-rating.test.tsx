import { describe, expect, it } from "vitest";

import { RottenTomatoesRating } from "@/modules/subject-page/ratings/rotten-tomatoes-rating";
import type { RtRating } from "@/types";

import { renderSingle } from "../../helpers/render";

const makeRating = (overrides?: Partial<RtRating>): RtRating => ({
  audienceCount: 50_000,
  audienceScore: 76,
  criticsCount: 300,
  criticsScore: 94,
  ...overrides,
});

describe(RottenTomatoesRating, () => {
  it("renders loading skeleton when unresolved", () => {
    const el = renderSingle(
      <RottenTomatoesRating rating={null} resolved={false} />
    );

    expect(el.classList.contains("atv-rating-panel-rt")).toBeTruthy();
    expect(el.classList.contains("is-loading")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-skeleton")).not.toBeNull();
  });

  it("renders empty state after resolution without rating", () => {
    const el = renderSingle(<RottenTomatoesRating rating={null} resolved />);

    expect(el.classList.contains("is-empty")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-skeleton")).toBeNull();
  });

  it("renders score values for both critics and audience", () => {
    const el = renderSingle(
      <RottenTomatoesRating rating={makeRating()} resolved />
    );

    const values = el.querySelectorAll(".atv-rt-score-value");
    expect(values).toHaveLength(2);
    expect(values[0]?.textContent).toBe("94%");
    expect(values[1]?.textContent).toBe("76%");
  });

  it("renders label items for critics and audience", () => {
    const el = renderSingle(
      <RottenTomatoesRating rating={makeRating()} resolved />
    );

    expect(el.querySelectorAll(".atv-rt-label-item")).toHaveLength(2);
    expect(
      el.querySelector(".is-critics .atv-rt-score-label")?.textContent
    ).toBe("影评人");
    expect(
      el.querySelector(".is-audience .atv-rt-score-label")?.textContent
    ).toBe("观众");
  });

  it("renders logo, rating-stars absence and count row", () => {
    const el = renderSingle(
      <RottenTomatoesRating rating={makeRating()} resolved />
    );

    expect(el.querySelector('[aria-label="Rotten Tomatoes"]')).not.toBeNull();
    expect(el.querySelector(".atv-rating-stars")).toBeNull();
    expect(el.querySelector(".atv-rt-count-row")?.textContent).toContain(
      "50,000"
    );
  });

  it("applies fresh and rotten classes independently", () => {
    const el = renderSingle(
      <RottenTomatoesRating
        rating={makeRating({ audienceScore: 88, criticsScore: 45 })}
        resolved
      />
    );

    expect(el.querySelector(".is-critics")?.classList).toContain("is-rotten");
    expect(el.querySelector(".is-audience")?.classList).toContain("is-fresh");
  });
});
