/* ── Rating Resolution Orchestrator ───────────────────────
 * Coordinates parallel resolution of IMDb, RT, and MC ratings.
 * Strategy: parallel-first with H1 title; fallback to IMDb title. */

import { fetchImdbRating as defaultFetchImdbRating } from "@/modules/subject/api/imdb";
import type { FetchImdbResult } from "@/modules/subject/api/imdb";
import { fetchMcRating as defaultFetchMcRating } from "@/modules/subject/api/metacritic";
import { fetchRtRating as defaultFetchRtRating } from "@/modules/subject/api/rotten";
import type { McRating, RtRating } from "@/modules/subject/domain";

import type { RatingResultMap, ResolutionContext } from "./types";

/** Resolve all rating sources in parallel where possible.
 *
 *  Strategy:
 *  1. If englishTitle is available from H1 → run IMDb + RT + MC in parallel.
 *  2. If no H1 title but IMDb returns one → run RT + MC with IMDb title as fallback.
 *  3. Error isolation: Promise.allSettled ensures one failure never blocks others. */
type ResolveAllDeps = {
  fetchImdbRating: typeof defaultFetchImdbRating;
  fetchRtRating: typeof defaultFetchRtRating;
  fetchMcRating: typeof defaultFetchMcRating;
};

const createDefaultDeps = (): ResolveAllDeps => ({
  fetchImdbRating: defaultFetchImdbRating,
  fetchMcRating: defaultFetchMcRating,
  fetchRtRating: defaultFetchRtRating,
});

const fetchImdbFromContext = (
  ctx: ResolutionContext,
  deps: ResolveAllDeps
): Promise<FetchImdbResult | null> => {
  if (!ctx.imdbId) {
    return Promise.resolve(null);
  }
  return deps.fetchImdbRating(ctx.imdbId, ctx.season);
};

const fetchRtFromContext = (
  ctx: ResolutionContext,
  deps: ResolveAllDeps
): Promise<RtRating | null> => {
  if (!ctx.englishTitle) {
    return Promise.resolve(null);
  }
  return deps.fetchRtRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
};

const fetchMcFromContext = (
  ctx: ResolutionContext,
  deps: ResolveAllDeps
): Promise<McRating | null> => {
  if (!ctx.englishTitle) {
    return Promise.resolve(null);
  }
  return deps.fetchMcRating(ctx.englishTitle, ctx.isTV, ctx.season, ctx.year);
};

const resolveAll = async (
  ctx: ResolutionContext,
  deps?: ResolveAllDeps
): Promise<RatingResultMap> => {
  const resolvedDeps = deps ?? createDefaultDeps();
  /* ── Fast path: English title available from H1 ──── */
  if (ctx.englishTitle) {
    const [imdb, rt, mc] = await Promise.allSettled([
      fetchImdbFromContext(ctx, resolvedDeps),
      fetchRtFromContext(ctx, resolvedDeps),
      fetchMcFromContext(ctx, resolvedDeps),
    ]);

    return {
      imdb: imdb.status === "fulfilled" ? imdb.value : null,
      mc: mc.status === "fulfilled" ? mc.value : null,
      rt: rt.status === "fulfilled" ? rt.value : null,
    };
  }

  /* ── Fallback: try to get English title from IMDb ── */
  const imdbResult = ctx.imdbId
    ? await fetchImdbFromContext(ctx, resolvedDeps).catch(() => null)
    : null;

  if (imdbResult?.title) {
    const fallbackCtx: ResolutionContext = {
      ...ctx,
      englishTitle: imdbResult.title,
    };
    const [rt, mc] = await Promise.allSettled([
      fetchRtFromContext(fallbackCtx, resolvedDeps),
      fetchMcFromContext(fallbackCtx, resolvedDeps),
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
