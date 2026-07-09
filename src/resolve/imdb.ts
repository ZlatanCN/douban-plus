/* ── IMDb Resolver — wraps fetchImdbRating ─────────────── */

import { fetchImdbRating } from "@/api/imdb";
import type { FetchImdbResult } from "@/api/imdb";

import type { ResolutionContext } from "./types";

/** Resolve IMDb rating from the resolution context.
 *  Returns null when no IMDb ID is available.
 *  Delegates to fetchImdbRating for the actual HTTP call. */
const resolveImdb = (
  ctx: ResolutionContext
): Promise<FetchImdbResult | null> => {
  if (!ctx.imdbId) {
    return Promise.resolve(null);
  }
  return fetchImdbRating(ctx.imdbId, ctx.season);
};

export { resolveImdb };
