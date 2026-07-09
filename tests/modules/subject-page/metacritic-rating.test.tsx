import { describe, expect, it } from "vitest";

import { MetacriticRating } from "@/modules/subject-page/ratings/metacritic-rating";
import type { McRating } from "@/types";

import { renderSingle } from "../../helpers/render";

describe(MetacriticRating, () => {
  it("renders loading skeleton when unresolved", () => {
    const el = renderSingle(
      <MetacriticRating rating={null} resolved={false} />
    );

    expect(el.classList.contains("atv-rating-panel-mc")).toBeTruthy();
    expect(el.classList.contains("is-loading")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-skeleton")).not.toBeNull();
  });

  it("renders empty state after resolution without rating", () => {
    const el = renderSingle(<MetacriticRating rating={null} resolved />);

    expect(el.classList.contains("is-empty")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-skeleton")).toBeNull();
  });

  it("renders score, count and logo when loaded", () => {
    const rating: McRating = { reviewCount: 1500, score: 82 };
    const el = renderSingle(<MetacriticRating rating={rating} resolved />);

    expect(el.classList.contains("is-loaded")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-score")?.textContent).toBe("82");
    expect(el.querySelector(".atv-rating-panel-count")?.textContent).toContain(
      "1,500"
    );
    expect(el.querySelector('[aria-label="Metacritic"]')).not.toBeNull();
    expect(el.querySelector(".atv-rating-stars")).toBeNull();
  });

  it("renders bar and Chinese label when loaded", () => {
    const rating: McRating = { reviewCount: 1500, score: 82 };
    const el = renderSingle(<MetacriticRating rating={rating} resolved />);

    expect(el.querySelector(".atv-mc-bar-fill")?.getAttribute("style")).toBe(
      "width: 82%;"
    );
    expect(el.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "普遍赞誉"
    );
  });

  it("classifies score bands consistently", () => {
    const high = renderSingle(
      <MetacriticRating rating={{ reviewCount: 0, score: 81 }} resolved />
    );
    const mixed = renderSingle(
      <MetacriticRating rating={{ reviewCount: 0, score: 40 }} resolved />
    );
    const low = renderSingle(
      <MetacriticRating rating={{ reviewCount: 0, score: 20 }} resolved />
    );

    expect(high.querySelector(".atv-mc-bar-fill")?.classList).toContain(
      "is-high"
    );
    expect(mixed.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "褒贬不一"
    );
    expect(low.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "大体差评"
    );
  });
});
