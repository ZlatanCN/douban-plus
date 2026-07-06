/* ── MC Resolver — wraps fetchMcRating ─────────────────── */

import { fetchMcRating } from "../api/metacritic";
import type { McRating } from "../types";
import type { ResolutionContext } from "./types";

/** Resolve Metacritic rating from the resolution context.
 *  Returns null when no English title is available. */
const resolveMc = (ctx: ResolutionContext): Promise<McRating | null> => {
  if (!ctx.englishTitle) {
    return Promise.resolve(null);
  }
  return fetchMcRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
};

export { resolveMc };
