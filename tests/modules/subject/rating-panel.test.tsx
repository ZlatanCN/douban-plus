import { describe, expect, it } from "vitest";

import { RatingPanel } from "@/modules/subject/ratings/rating-panel";
import type { RatingResultMap } from "@/modules/subject/resolve/types";

import { renderSingle } from "../../helpers/render";
import {
  makeImdbRating,
  makeMcRating,
  makeRtRating,
} from "./external-rating-test-support";

const countSelector =
  ".atv-rating-panel-count, .atv-mc-rating-count, .atv-rt-count-value";

const makeExternalRatings = (overrides?: {
  imdbCount?: number;
  metacritic?: ReturnType<typeof makeMcRating>;
  rottenTomatoes?: ReturnType<typeof makeRtRating>;
}): RatingResultMap => ({
  imdb: {
    diagnostic: null,
    rating: {
      rating: makeImdbRating({ count: overrides?.imdbCount ?? 1_200_000 }),
      sourceUrl: "https://www.imdb.com/title/tt0111161/",
      title: "Test film",
    },
    status: "resolved",
  },
  mc: {
    diagnostic: null,
    rating: overrides?.metacritic ?? makeMcRating(),
    status: "resolved",
  },
  rt: {
    diagnostic: null,
    rating: overrides?.rottenTomatoes ?? makeRtRating(),
    status: "resolved",
  },
});

const renderRatings = (
  count: number,
  externalRatings: RatingResultMap
): HTMLElement =>
  renderSingle(
    <RatingPanel
      douban={{ count, score: 8.5 }}
      externalRatings={externalRatings}
      imdbId="tt0111161"
    />
  );

const countTexts = (panel: HTMLElement): string[] =>
  [...panel.querySelectorAll<HTMLElement>(countSelector)].map(
    (node) => node.textContent?.trim() ?? ""
  );

describe("rating panel counts", () => {
  it("renders only formatted counts across Douban, IMDb, Meta and RT", () => {
    const panel = renderRatings(12_345, makeExternalRatings());

    expect(countTexts(panel)).toStrictEqual([
      "12,345",
      "1,200,000",
      "1,500",
      "1,269",
      "300",
      "50,000",
    ]);
  });

  it("leaves absent counts empty while preserving the rating cells", () => {
    const panel = renderRatings(
      0,
      makeExternalRatings({
        imdbCount: 0,
        metacritic: makeMcRating({
          audience: { displayScore: "9.1", reviewCount: null, score: 9.1 },
          critics: { displayScore: "82", reviewCount: null, score: 82 },
        }),
        rottenTomatoes: makeRtRating({
          audienceCount: null,
          criticsCount: null,
        }),
      })
    );

    expect(countTexts(panel)).toStrictEqual(["", "", "", "", "", ""]);
    expect(panel.querySelectorAll(".atv-rating-panel-score")).toHaveLength(6);
  });
});
