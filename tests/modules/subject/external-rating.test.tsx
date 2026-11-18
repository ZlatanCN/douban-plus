import { describe, expect, it } from "vitest";

import { ExternalRating } from "@/modules/subject/ratings/external-rating";

import { renderIntoRoot, renderSingle } from "../../helpers/render";
import {
  makeImdbRating,
  makeMcRating,
  makeRtRating,
} from "./external-rating-test-support";

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
      <ExternalRating
        rating={makeImdbRating()}
        resolved
        source="imdb"
        sourceUrl="https://www.imdb.com/title/tt0111161/"
      />
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

  it("links the IMDb logo to its rating page", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeImdbRating()}
        resolved
        source="imdb"
        sourceUrl="https://www.imdb.com/title/tt0111161/"
      />
    );

    expect(el.querySelector<HTMLAnchorElement>(".atv-imdb-source")?.href).toBe(
      "https://www.imdb.com/title/tt0111161/"
    );
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

  it("renders native Metascore and User score scales with their own counts", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeMcRating()}
        resolved
        source="metacritic"
        sourceUrl="https://www.metacritic.com/movie/test/"
      />
    );

    expect({
      loaded:
        el.classList.contains("atv-rating-panel-mc") &&
        el.classList.contains("is-loaded"),
      critics: {
        score: el.querySelector(".atv-mc-critics .atv-mc-score-value")
          ?.textContent,
        scale: el.querySelector(".atv-mc-critics .atv-mc-score-scale")
          ?.textContent,
        count: el.querySelector(".atv-mc-critics .atv-mc-rating-count")
          ?.textContent,
      },
      audience: {
        score: el.querySelector(".atv-mc-audience .atv-mc-score-value")
          ?.textContent,
        scale: el.querySelector(".atv-mc-audience .atv-mc-score-scale")
          ?.textContent,
        count: el.querySelector(".atv-mc-audience .atv-mc-rating-count")
          ?.textContent,
      },
      oldLabel: el.querySelector(".atv-mc-label-row"),
      logo: el.querySelector('[aria-label="Metacritic"]') !== null,
    }).toMatchObject({
      loaded: true,
      critics: { score: "82", scale: "/100", count: "评价 1,500" },
      audience: { score: "9.1", scale: "/10", count: "评价 1,269" },
      oldLabel: null,
      logo: true,
    });
  });

  it("links the Metacritic logo to its rating page", () => {
    const rating = makeMcRating();
    const el = renderSingle(
      <ExternalRating
        rating={rating}
        resolved
        source="metacritic"
        sourceUrl={rating.sourceUrl}
      />
    );

    expect(
      el.querySelector<HTMLAnchorElement>(".atv-metacritic-source")?.href
    ).toBe("https://www.metacritic.com/movie/test/");
  });

  it("renders only the available side without inventing the missing side", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeMcRating({ audience: null })}
        resolved
        source="metacritic"
      />
    );

    expect(el.querySelectorAll(".atv-mc-score-side")).toHaveLength(1);
    expect(
      el.querySelector(".atv-mc-critics .atv-mc-score-scale")?.textContent
    ).toBe("/100");
    expect(el.querySelector(".atv-mc-audience")).toBeNull();
    expect(el.querySelector(".atv-rating-stars")).toBeNull();
  });

  it("hides a missing count while keeping the valid audience score", () => {
    const high = renderSingle(
      <ExternalRating
        rating={makeMcRating({
          critics: null,
          audience: { displayScore: "0", score: 0, reviewCount: null },
        })}
        resolved
        source="metacritic"
      />
    );

    expect(
      high.querySelector(".atv-mc-audience .atv-mc-score-value")?.textContent
    ).toBe("0");
    expect(
      high.querySelector(".atv-mc-audience .atv-mc-score-scale")?.textContent
    ).toBe("/10");
    expect(
      high.querySelector(".atv-mc-rating-count")?.getAttribute("aria-hidden")
    ).toBe("true");
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

    expect(el.querySelectorAll(".atv-rating-dual-label")).toHaveLength(2);
    expect(
      el.querySelector(".atv-rt-critics .atv-rt-score-label")?.textContent
    ).toBe("影评人");
    expect(
      el.querySelector(".atv-rt-audience .atv-rt-score-label")?.textContent
    ).toBe("观众");
    expect(el.querySelectorAll(".atv-rt-score-icon")).toHaveLength(0);
  });

  it("renders Rotten Tomatoes logo, count row and no rating stars", () => {
    const el = renderSingle(
      <ExternalRating rating={makeRtRating()} resolved source="rt" />
    );

    expect(el.querySelector('[aria-label="Rotten Tomatoes"]')).not.toBeNull();
    expect(el.querySelector(".atv-rating-stars")).toBeNull();
    expect(el.querySelectorAll(".atv-rt-count-value")).toHaveLength(2);
    expect(
      el.querySelector(".atv-rt-audience .atv-rt-count-value")?.textContent
    ).toContain("50,000");
  });

  it("keeps the full Rotten Tomatoes audience range with its plus marker", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeRtRating({
          audienceCount: { kind: "range", lowerBound: 250_000 },
          criticsCount: { kind: "exact", value: 147 },
        })}
        resolved
        source="rt"
      />
    );

    expect(
      el.querySelector(".atv-rt-critics .atv-rt-count-value")?.textContent
    ).toBe("评价 147");
    expect(
      el.querySelector(".atv-rt-audience .atv-rt-count-value")?.textContent
    ).toBe("评价 250,000+");
  });

  it("keeps a longer Rotten Tomatoes audience range on the audience side", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeRtRating({
          audienceCount: { kind: "range", lowerBound: 2_500_000 },
          criticsCount: { kind: "exact", value: 147 },
        })}
        resolved
        source="rt"
      />
    );

    expect(
      el.querySelector(".atv-rt-critics .atv-rt-count-value")?.textContent
    ).toBe("评价 147");
    expect(
      el.querySelector(".atv-rt-audience .atv-rt-count-value")?.textContent
    ).toBe("评价 2,500,000+");
  });
});
