import type {
  ImdbRating as ImdbRatingData,
  McRating,
  RtRating,
} from "@/modules/subject/domain";

const makeImdbRating = (
  overrides?: Partial<ImdbRatingData>
): ImdbRatingData => ({
  count: 1_200_000,
  score: 8.5,
  ...overrides,
});

const makeMcRating = (overrides?: Partial<McRating>): McRating => ({
  audience: { displayScore: "9.1", reviewCount: 1269, score: 9.1 },
  critics: { displayScore: "82", reviewCount: 1500, score: 82 },
  fetchedAt: 1_700_000_000_000,
  object: {
    kind: "movie",
    metacriticId: "movie/test",
    season: null,
    seriesId: null,
    seriesMetacriticId: null,
    subjectId: "1",
  },
  sourceUrl: "https://www.metacritic.com/movie/test/",
  stale: false,
  ...overrides,
});

const makeRtRating = (overrides?: Partial<RtRating>): RtRating => ({
  audienceCount: { kind: "exact", value: 50_000 },
  audienceGroup: "all",
  audienceScore: 76,
  criticsCount: { kind: "exact", value: 300 },
  criticsScore: 94,
  fetchedAt: 1_700_000_000_000,
  object: { kind: "movie", rtId: "m/test", subjectId: "1" },
  sourceUrl: "https://www.rottentomatoes.com/m/test",
  stale: false,
  ...overrides,
});

export { makeImdbRating, makeMcRating, makeRtRating };
