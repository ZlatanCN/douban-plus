import { describe, expect, it } from "vitest";

import type {
  ImdbRating as ImdbRatingData,
  McRating,
  RtRating,
} from "@/modules/subject/domain";
import { ExternalRating } from "@/modules/subject/ratings/external-rating";

import { renderIntoRoot, renderSingle } from "../../helpers/render";

const makeImdbRating = (
  overrides?: Partial<ImdbRatingData>
): ImdbRatingData => ({
  count: 1_200_000,
  score: 8.5,
  ...overrides,
});

const makeMcRating = (overrides?: Partial<McRating>): McRating => ({
  reviewCount: 1500,
  score: 82,
  ...overrides,
});

const makeRtRating = (overrides?: Partial<RtRating>): RtRating => ({
  audienceCount: 50_000,
  audienceScore: 76,
  criticsCount: 300,
  criticsScore: 94,
  ...overrides,
});

describe(ExternalRating, () => {
  it("renders shared loading state for external sources", () => {
    const loading = renderSingle(
      <ExternalRating rating={null} resolved={false} source="imdb" />
    );

    expect(loading.classList.contains("atv-rating-panel-imdb")).toBeTruthy();
    expect(loading.classList.contains("is-loading")).toBeTruthy();
    expect(loading.querySelector(".atv-rating-panel-skeleton")).not.toBeNull();
  });

  it("omits an external source that resolves without a rating", () => {
    const root = renderIntoRoot(
      <ExternalRating rating={null} resolved source="metacritic" />
    );

    expect(root.firstElementChild).toBeNull();
  });

  it("renders IMDb score, stars, count and logo when loaded", () => {
    const el = renderSingle(
      <ExternalRating rating={makeImdbRating()} resolved source="imdb" />
    );

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

  it("formats IMDb integer score to one decimal place", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeImdbRating({ count: 500_000, score: 7 })}
        resolved
        source="imdb"
      />
    );

    expect(el.querySelector(".atv-rating-panel-score")?.textContent).toBe(
      "7.0"
    );
  });

  it("renders Metacritic score, count and logo when loaded", () => {
    const el = renderSingle(
      <ExternalRating rating={makeMcRating()} resolved source="metacritic" />
    );

    expect(el.classList.contains("atv-rating-panel-mc")).toBeTruthy();
    expect(el.classList.contains("is-loaded")).toBeTruthy();
    expect(el.querySelector(".atv-rating-panel-score")?.textContent).toBe("82");
    expect(el.querySelector(".atv-rating-panel-count")?.textContent).toContain(
      "1,500"
    );
    expect(el.querySelector('[aria-label="Metacritic"]')).not.toBeNull();
  });

  it("renders Metacritic bar, Chinese label and no rating stars when loaded", () => {
    const el = renderSingle(
      <ExternalRating rating={makeMcRating()} resolved source="metacritic" />
    );

    expect(el.querySelector(".atv-mc-bar-fill")?.getAttribute("style")).toBe(
      "width: 82%;"
    );
    expect(el.querySelector(".atv-mc-word-label")?.textContent).toBe(
      "普遍赞誉"
    );
    expect(el.querySelector(".atv-rating-stars")).toBeNull();
  });

  it("classifies Metacritic score bands consistently", () => {
    const high = renderSingle(
      <ExternalRating
        rating={makeMcRating({ reviewCount: 0, score: 81 })}
        resolved
        source="metacritic"
      />
    );
    const mixed = renderSingle(
      <ExternalRating
        rating={makeMcRating({ reviewCount: 0, score: 40 })}
        resolved
        source="metacritic"
      />
    );
    const low = renderSingle(
      <ExternalRating
        rating={makeMcRating({ reviewCount: 0, score: 20 })}
        resolved
        source="metacritic"
      />
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

  it("renders Rotten Tomatoes critics and audience scores", () => {
    const el = renderSingle(
      <ExternalRating rating={makeRtRating()} resolved source="rt" />
    );

    const values = el.querySelectorAll(".atv-rt-score-value");
    expect(el.classList.contains("atv-rating-panel-rt")).toBeTruthy();
    expect(values).toHaveLength(2);
    expect(values[0]?.textContent).toBe("94%");
    expect(values[1]?.textContent).toBe("76%");
  });

  it("renders Rotten Tomatoes labels", () => {
    const el = renderSingle(
      <ExternalRating rating={makeRtRating()} resolved source="rt" />
    );

    expect(el.querySelectorAll(".atv-rt-label-item")).toHaveLength(2);
    expect(
      el.querySelector(".is-critics .atv-rt-score-label")?.textContent
    ).toBe("影评人");
    expect(
      el.querySelector(".is-audience .atv-rt-score-label")?.textContent
    ).toBe("观众");
  });

  it("renders Rotten Tomatoes logo, count row and no rating stars", () => {
    const el = renderSingle(
      <ExternalRating rating={makeRtRating()} resolved source="rt" />
    );

    expect(el.querySelector('[aria-label="Rotten Tomatoes"]')).not.toBeNull();
    expect(el.querySelector(".atv-rating-stars")).toBeNull();
    expect(el.querySelector(".atv-rt-count-row")?.textContent).toContain(
      "50,000"
    );
  });

  it("applies Rotten Tomatoes fresh and rotten classes independently", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeRtRating({ audienceScore: 88, criticsScore: 45 })}
        resolved
        source="rt"
      />
    );

    expect(el.querySelector(".is-critics")?.classList).toContain("is-rotten");
    expect(el.querySelector(".is-audience")?.classList).toContain("is-fresh");
  });
});
