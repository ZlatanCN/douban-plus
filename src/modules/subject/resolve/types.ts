import type { FetchImdbResult } from "@/modules/subject/api/imdb";
import type {
  McRating,
  RtObjectKind,
  RtRating,
} from "@/modules/subject/domain";

type ResolutionContext = {
  imdbId: string | null;
  kind: RtObjectKind;
  season: number | null;
  seasonConflict: boolean;
  subjectId: string;
  subjectTitle: string;
  unsupportedEpisode: boolean;
};

type SourceResult<T> = {
  rating: T | null;
  status: "pending" | "resolved";
};

type RatingResultMap = {
  imdb: SourceResult<FetchImdbResult>;
  mc: SourceResult<McRating>;
  rt: SourceResult<RtRating>;
};

const emptyRatingResults = (): RatingResultMap => ({
  imdb: { rating: null, status: "pending" },
  mc: { rating: null, status: "pending" },
  rt: { rating: null, status: "pending" },
});

export type { RatingResultMap, ResolutionContext, SourceResult };
export { emptyRatingResults };
