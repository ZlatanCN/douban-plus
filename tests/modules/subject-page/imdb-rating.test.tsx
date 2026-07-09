import { describe, expect, it } from "vitest";

import { ImdbRating } from "@/modules/subject-page/ratings/imdb-rating";
import type { ImdbRating as ImdbRatingData } from "@/types";

import { renderSingle } from "../../helpers/render";

describe(ImdbRating, () => {
  it("renders loading skeleton when unresolved", () => {
    const el = renderSingle(<ImdbRating rating={null} resolved={false} />);
    expect(el.classList.contains("atv-rating-panel-imdb")).toBeTruthy();
    expect(el.classList.contains("is-loading")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-skeleton")).not.toBeNull();
  });

  it("renders empty state after resolution without rating", () => {
    const el = renderSingle(<ImdbRating rating={null} resolved />);
    expect(el.classList.contains("is-empty")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-skeleton")).toBeNull();
  });

  it("renders score, stars, count and logo when rating is provided", () => {
    const rating: ImdbRatingData = { count: 1_200_000, score: 8.5 };
    const el = renderSingle(<ImdbRating rating={rating} resolved />);
    expect(el.classList.contains("is-loaded")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-score")?.textContent).toBe(
      "8.5"
    );
    expect(el.querySelector(".atv-rating-panel-count")?.textContent).toContain(
      "1,200,000"
    );
    expect(el.querySelector('[aria-label="IMDb"]')).not.toBeNull();
    expect(el.querySelectorAll(".atv-rating-stars svg")).toHaveLength(5);
  });

  it("formats integer score to one decimal place", () => {
    const el = renderSingle(
      <ImdbRating rating={{ count: 500_000, score: 7 }} resolved />
    );
    expect(el.querySelector(".atv-rating-panel-score")?.textContent).toBe(
      "7.0"
    );
  });
});
