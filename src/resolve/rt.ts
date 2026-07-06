/* ── RT Resolver — wraps fetchRtRating ─────────────────── */

import { fetchRtRating } from "../api/rotten";
import type { RtRating } from "../types";
import type { ResolutionContext } from "./types";

/** Resolve Rotten Tomatoes rating from the resolution context.
 *  Returns null when no English title is available. */
const resolveRt = (ctx: ResolutionContext): Promise<RtRating | null> => {
  if (!ctx.englishTitle) {
    return Promise.resolve(null);
  }
  return fetchRtRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
};

export { resolveRt };
