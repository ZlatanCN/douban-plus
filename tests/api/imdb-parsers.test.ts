import { describe, expect, it } from "vitest";

import {
  extractTitleFields,
  parseResponse,
  parseSeasonRating,
} from "@/modules/subject/api/imdb-parsers";
import type { ParsedRaw } from "@/modules/subject/api/imdb-parsers";

const seriesField = (
  series?: { id: string; titleText: string } | null
):
  | { series: { id: string; titleText: { text: string } } }
  | null
  | undefined => {
  if (series) {
    return {
      series: { id: series.id, titleText: { text: series.titleText } },
    };
  }
  if (series === null) {
    return null;
  }
  return undefined;
};

const makeTitleJson = (overrides?: {
  aggregateRating?: number;
  errors?: unknown;
  series?: { id: string; titleText: string } | null;
  titleText?: string;
  voteCount?: number;
}): string =>
  JSON.stringify({
    data: {
      title: {
        id: "tt0",
        ratingsSummary: {
          aggregateRating: overrides?.aggregateRating ?? 8.5,
          voteCount: overrides?.voteCount ?? 1000,
        },
        series: seriesField(overrides?.series),
        titleText: { text: overrides?.titleText ?? "Test Title" },
      },
    },
    errors: overrides?.errors,
  });

const makeSeasonJson = (
  episodes: ({ aggregateRating: number; voteCount: number } | null)[]
): string =>
  JSON.stringify({
    data: {
      title: {
        episodes: {
          episodes: {
            edges: episodes.map((ep) => ({
              node: ep
                ? {
                    ratingsSummary: {
                      aggregateRating: ep.aggregateRating,
                      voteCount: ep.voteCount,
                    },
                  }
                : null,
            })),
          },
        },
      },
    },
  });

describe(extractTitleFields, () => {
  it("extracts rating, title, and null seriesInfo for a movie", () => {
    const parsed = JSON.parse(makeTitleJson({ series: null })) as ParsedRaw;
    const result = extractTitleFields(parsed);

    expect(result).toStrictEqual({
      aggregateRating: 8.5,
      seriesInfo: null,
      titleText: "Test Title",
      voteCount: 1000,
    });
  });

  it("extracts seriesInfo when the tconst is an episode", () => {
    const parsed = JSON.parse(
      makeTitleJson({
        series: { id: "tt0944947", titleText: "Game of Thrones" },
      })
    ) as ParsedRaw;
    const result = extractTitleFields(parsed);

    expect(result?.seriesInfo).toStrictEqual({
      id: "tt0944947",
      titleText: "Game of Thrones",
    });
  });

  it("returns null when the response has an errors path", () => {
    const parsed = JSON.parse(
      makeTitleJson({ errors: [{ message: "Not found" }] })
    ) as ParsedRaw;
    expect(extractTitleFields(parsed)).toBeNull();
  });

  it("falls back to the episode title when the series has no titleText", () => {
    const parsed = {
      data: {
        title: {
          id: "tt0",
          ratingsSummary: { aggregateRating: 9, voteCount: 5 },
          series: { series: { id: "tt1" } },
          titleText: { text: "Winter Is Coming" },
        },
      },
    } as ParsedRaw;
    const result = extractTitleFields(parsed);

    expect(result?.seriesInfo).toStrictEqual({
      id: "tt1",
      titleText: "Winter Is Coming",
    });
  });
});

describe(parseResponse, () => {
  it("returns ParsedResponse for valid JSON with title data", () => {
    const result = parseResponse(
      makeTitleJson({ aggregateRating: 9.3, voteCount: 1_200_000 })
    );

    expect(result).toStrictEqual({
      aggregateRating: 9.3,
      seriesInfo: null,
      titleText: "Test Title",
      voteCount: 1_200_000,
    });
  });

  it("returns error when JSON has an errors path", () => {
    const result = parseResponse(
      JSON.stringify({ errors: [{ message: "Not found" }] })
    );
    expect(result).toStrictEqual({ error: true });
  });

  it("returns error for invalid JSON", () => {
    expect(parseResponse("not-json-at-all")).toStrictEqual({ error: true });
  });

  it("returns a null-filled ParsedResponse when the title data is missing", () => {
    const result = parseResponse(JSON.stringify({ data: {} }));
    expect(result).toStrictEqual({
      aggregateRating: undefined,
      seriesInfo: null,
      titleText: null,
      voteCount: undefined,
    });
  });
});

describe(parseSeasonRating, () => {
  it("computes a vote-weighted average across multiple episodes", () => {
    const json = makeSeasonJson([
      { aggregateRating: 9, voteCount: 100 },
      { aggregateRating: 8, voteCount: 200 },
    ]);
    const result = parseSeasonRating(json);

    // (9*100 + 8*200) / 300 = 2500/300 = 8.333... → rounded to 8.3
    expect(result).toStrictEqual({
      rating: { count: 300, score: 8.3 },
    });
  });

  it("returns a single episode rating unchanged", () => {
    const json = makeSeasonJson([{ aggregateRating: 9.5, voteCount: 50 }]);
    expect(parseSeasonRating(json)).toStrictEqual({
      rating: { count: 50, score: 9.5 },
    });
  });

  it("returns null when there are no edges", () => {
    expect(parseSeasonRating(makeSeasonJson([]))).toBeNull();
  });

  it("returns null when all episodes have zero votes", () => {
    const json = makeSeasonJson([
      { aggregateRating: 9, voteCount: 0 },
      { aggregateRating: 8, voteCount: 0 },
    ]);
    expect(parseSeasonRating(json)).toBeNull();
  });

  it("skips edges with null nodes but includes valid ones", () => {
    const json = makeSeasonJson([
      null,
      { aggregateRating: 8, voteCount: 100 },
      null,
    ]);
    expect(parseSeasonRating(json)).toStrictEqual({
      rating: { count: 100, score: 8 },
    });
  });

  it("returns null for invalid JSON", () => {
    expect(parseSeasonRating("not-json")).toBeNull();
  });
});
