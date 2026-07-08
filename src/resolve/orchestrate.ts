/* ── Rating Resolution Orchestrator ───────────────────────
 * Coordinates parallel resolution of IMDb, RT, and MC ratings.
 * Strategy: parallel-first with H1 title; fallback to IMDb title. */

import { resolveImdb as defaultResolveImdb } from "./imdb";
import { resolveMc as defaultResolveMc } from "./mc";
import { resolveRt as defaultResolveRt } from "./rt";
import type { RatingResultMap, ResolutionContext } from "./types";

/** Resolve all rating sources in parallel where possible.
 *
 *  Strategy:
 *  1. If englishTitle is available from H1 → run IMDb + RT + MC in parallel.
 *  2. If no H1 title but IMDb returns one → run RT + MC with IMDb title as fallback.
 *  3. Error isolation: Promise.allSettled ensures one failure never blocks others. */
interface ResolveAllDeps {
  resolveImdb: typeof defaultResolveImdb;
  resolveRt: typeof defaultResolveRt;
  resolveMc: typeof defaultResolveMc;
}

const createDefaultDeps = (): ResolveAllDeps => ({
  resolveImdb: defaultResolveImdb,
  resolveMc: defaultResolveMc,
  resolveRt: defaultResolveRt,
});

const resolveAll = async (
  ctx: ResolutionContext,
  deps?: ResolveAllDeps
): Promise<RatingResultMap> => {
  const { resolveImdb, resolveMc, resolveRt } = deps ?? createDefaultDeps();
  /* ── Fast path: English title available from H1 ──── */
  if (ctx.englishTitle) {
    const [imdb, rt, mc] = await Promise.allSettled([
      resolveImdb(ctx),
      resolveRt(ctx),
      resolveMc(ctx),
    ]);

    return {
      imdb: imdb.status === "fulfilled" ? imdb.value : null,
      mc: mc.status === "fulfilled" ? mc.value : null,
      rt: rt.status === "fulfilled" ? rt.value : null,
    };
  }

  /* ── Fallback: try to get English title from IMDb ── */
  const imdbResult = await resolveImdb(ctx);

  if (imdbResult?.title) {
    const fallbackCtx: ResolutionContext = {
      ...ctx,
      englishTitle: imdbResult.title,
    };
    const [rt, mc] = await Promise.allSettled([
      resolveRt(fallbackCtx),
      resolveMc(fallbackCtx),
    ]);

    return {
      imdb: imdbResult,
      mc: mc.status === "fulfilled" ? mc.value : null,
      rt: rt.status === "fulfilled" ? rt.value : null,
    };
  }

  /* ── No title anywhere, return what we have ──────── */
  return { imdb: imdbResult, mc: null, rt: null };
};

export { resolveAll };
