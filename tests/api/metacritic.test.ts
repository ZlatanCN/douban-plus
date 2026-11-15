import { describe, expect, it, vi } from "vitest";

import { parseMcPage } from "@/modules/subject/api/metacritic-parser";
import type { TargetResult } from "@/modules/subject/api/metacritic-wikidata-claims";

const mockGmGetResponse = vi.hoisted(() =>
  vi.fn<
    (
      url: string
    ) => Promise<{ finalUrl: string; responseText: string; status: number }>
  >()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGetResponse: mockGmGetResponse,
}));

type MetacriticTarget = Extract<TargetResult, { status: "matched" }>;

const seasonTarget: MetacriticTarget = {
  kind: "season",
  metacriticId: "tv/game-of-thrones/season-2",
  season: 2,
  seriesId: "Q23572",
  status: "matched",
};

const makeSeasonPage = (
  overrides: {
    canonicalUrl?: string;
    partOfSeriesUrl?: string;
    ratingValue?: number;
    reviewCount?: number;
    seasonNumber?: number;
  } = {}
): string => {
  const canonicalUrl =
    overrides.canonicalUrl ??
    "https://www.metacritic.com/tv/game-of-thrones/season-2/";
  const partOfSeriesUrl =
    overrides.partOfSeriesUrl ??
    "https://www.metacritic.com/tv/game-of-thrones/";
  return `<link rel="canonical" href="${canonicalUrl}"><script type="application/ld+json">${JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "TVSeason",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: overrides.ratingValue ?? 90,
        reviewCount: overrides.reviewCount ?? 26,
      },
      name: "Game of Thrones: Season 2",
      partOfSeries: { "@type": "TVSeries", url: partOfSeriesUrl },
      seasonNumber: overrides.seasonNumber ?? 2,
    }
  )}</script>`;
};

describe(parseMcPage, () => {
  it("reads the score from the exact mapped season page", () => {
    expect(parseMcPage(makeSeasonPage(), seasonTarget)).toStrictEqual({
      reviewCount: 26,
      score: 90,
    });
  });

  it("rejects a page whose canonical URL belongs to another season", () => {
    const html = makeSeasonPage({
      canonicalUrl: "https://www.metacritic.com/tv/game-of-thrones/season-3/",
    });
    expect(parseMcPage(html, seasonTarget)).toBeNull();
  });

  it("rejects a page with the wrong season number or parent series", () => {
    expect(
      parseMcPage(makeSeasonPage({ seasonNumber: 3 }), seasonTarget)
    ).toBeNull();
    expect(
      parseMcPage(
        makeSeasonPage({
          partOfSeriesUrl: "https://www.metacritic.com/tv/another-series/",
        }),
        seasonTarget
      )
    ).toBeNull();
  });

  it("rejects a score outside the valid Metascore range", () => {
    expect(
      parseMcPage(makeSeasonPage({ ratingValue: 101 }), seasonTarget)
    ).toBeNull();
  });
});
