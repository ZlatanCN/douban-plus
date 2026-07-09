/* ── Rating Resolution Seam Types ──────────────────────── */

import type { FetchImdbResult } from "@/api/imdb";
import type { McRating, RtRating } from "@/types";

/** All identifiers available for rating resolution.
 *  Every resolver reads from this context — no resolver touches the DOM
 *  or extracts identifiers independently. */
type ResolutionContext = {
  /** IMDb ID (tconst), e.g. "tt0111161". Null when the page has no IMDb link. */
  imdbId: string | null;
  /** English title extracted from Douban H1, e.g. "The Shawshank Redemption". */
  englishTitle: string | null;
  /** True for TV series/season pages. */
  isTV: boolean;
  /** Season number for TV series, e.g. 5 for "Game of Thrones S5". */
  season?: number;
  /** Release year for movie URL disambiguation, e.g. "1994". */
  year?: string;
};

/** The complete result of resolving all rating sources.
 *  Each field is independent — one null never implies another. */
type RatingResultMap = {
  imdb: FetchImdbResult | null;
  rt: RtRating | null;
  mc: McRating | null;
};

type RatingSource = "imdb" | "rt" | "mc";

export type { RatingResultMap, RatingSource, ResolutionContext };
