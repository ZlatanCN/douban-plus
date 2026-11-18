import { describe, expect, it } from "vitest";

import { ExternalRating } from "@/modules/subject/ratings/external-rating";

import { renderSingle } from "../../helpers/render";
import { makeRtRating } from "./external-rating-test-support";

describe("Rotten Tomatoes rating freshness labels", () => {
  it("applies fresh and rotten classes independently", () => {
    const el = renderSingle(
      <ExternalRating
        rating={makeRtRating({ audienceScore: 88, criticsScore: 45 })}
        resolved
        source="rt"
      />
    );

    expect(
      el.querySelector(".atv-rt-critics .atv-rt-score-value")?.classList
    ).toContain("is-rotten");
    expect(
      el.querySelector(".atv-rt-audience .atv-rt-score-value")?.classList
    ).toContain("is-fresh");
  });
});
