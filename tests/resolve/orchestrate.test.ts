/* ── resolveAll — Orchestrator Tests ────────────────────── */

import { describe, it, expect, vi } from "vitest";

import type { FetchImdbResult } from "../../src/api/imdb";
import type { ResolutionContext } from "../../src/resolve/types";
import type { McRating, RtRating } from "../../src/types";

// Mock request utils to prevent GM_xmlhttpRequest check from firing
// during module import chain resolution.
vi.mock("../../src/utils/request", () => ({
  gmGet: vi.fn(),
  gmPost: vi.fn(),
}));

// Import after all mocks are set up
const { resolveAll } = await import("../../src/resolve/orchestrate");

/* ── Helpers ──────────────────────────────────────────── */

const makeCtx = (
  overrides?: Partial<ResolutionContext>
): ResolutionContext => ({
  englishTitle: null,
  imdbId: null,
  isTV: false,
  ...overrides,
});

const makeImdbResult = (
  overrides?: Partial<FetchImdbResult>
): FetchImdbResult => ({
  rating: { count: 1_200_000, score: 9.3 },
  title: "The Shawshank Redemption",
  ...overrides,
});

const makeRtRating = (overrides?: Partial<RtRating>): RtRating => ({
  audienceCount: 173_380,
  audienceScore: 76,
  criticsCount: 300,
  criticsScore: 94,
  ...overrides,
});

const makeMcRating = (overrides?: Partial<McRating>): McRating => ({
  reviewCount: 22,
  score: 82,
  ...overrides,
});

/* ── Suite ────────────────────────────────────────────── */

describe("resolveAll", () => {
  /* ── Happy: all three with H1 title ─────────────── */

  it("resolves all three in parallel when englishTitle is available (t1)", async () => {
    const resolveImdb = vi.fn().mockResolvedValue(makeImdbResult());
    const resolveRt = vi.fn().mockResolvedValue(makeRtRating());
    const resolveMc = vi.fn().mockResolvedValue(makeMcRating());

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Shawshank Redemption",
        imdbId: "tt0111161",
      }),
      { resolveImdb, resolveMc, resolveRt }
    );

    expect(resolveImdb).toHaveBeenCalledTimes(1);
    expect(resolveRt).toHaveBeenCalledTimes(1);
    expect(resolveMc).toHaveBeenCalledTimes(1);

    expect(result.imdb).toEqual(makeImdbResult());
    expect(result.rt).toEqual(makeRtRating());
    expect(result.mc).toEqual(makeMcRating());
  });

  /* ── Fallback: no H1 title, IMDb provides title ── */

  it("resolves RT/MC after IMDb when no H1 title but IMDb has title (t2)", async () => {
    const resolveImdb = vi
      .fn()
      .mockResolvedValue(makeImdbResult({ title: "Inception" }));
    const resolveRt = vi.fn().mockResolvedValue(makeRtRating());
    const resolveMc = vi.fn().mockResolvedValue(makeMcRating());

    const result = await resolveAll(
      makeCtx({
        englishTitle: null,
        imdbId: "tt1375666",
      }),
      { resolveImdb, resolveMc, resolveRt }
    );

    // RT/MC should be called with englishTitle from IMDb result
    expect(resolveImdb).toHaveBeenCalledTimes(1);
    expect(resolveRt).toHaveBeenCalledWith(
      expect.objectContaining({ englishTitle: "Inception" })
    );
    expect(resolveMc).toHaveBeenCalledWith(
      expect.objectContaining({ englishTitle: "Inception" })
    );

    expect(result.imdb).toEqual(makeImdbResult({ title: "Inception" }));
    expect(result.rt).toEqual(makeRtRating());
    expect(result.mc).toEqual(makeMcRating());
  });

  /* ── Error isolation ───────────────────────────── */

  it("isolates errors: one rejected resolver does not block others (t3)", async () => {
    const resolveImdb = vi
      .fn()
      .mockRejectedValue(new Error("IMDb network error"));
    const resolveRt = vi.fn().mockResolvedValue(makeRtRating());
    const resolveMc = vi.fn().mockResolvedValue(makeMcRating());

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Matrix",
        imdbId: "tt0133093",
      }),
      { resolveImdb, resolveMc, resolveRt }
    );

    expect(result.imdb).toBeNull();
    expect(result.rt).toEqual(makeRtRating());
    expect(result.mc).toEqual(makeMcRating());
  });

  it("isolates errors: RT failure still returns IMDb and MC (t4)", async () => {
    const resolveImdb = vi.fn().mockResolvedValue(makeImdbResult());
    const resolveRt = vi.fn().mockRejectedValue(new Error("RT error"));
    const resolveMc = vi.fn().mockResolvedValue(makeMcRating());

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Matrix",
        imdbId: "tt0133093",
      }),
      { resolveImdb, resolveMc, resolveRt }
    );

    expect(result.imdb).toEqual(makeImdbResult());
    expect(result.rt).toBeNull();
    expect(result.mc).toEqual(makeMcRating());
  });

  /* ── No identifiers ────────────────────────────── */

  it("returns all nulls when no identifiers available (t5)", async () => {
    const resolveImdb = vi.fn().mockResolvedValue(null);
    const resolveRt = vi.fn().mockResolvedValue(null);
    const resolveMc = vi.fn().mockResolvedValue(null);

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: null }),
      { resolveImdb, resolveMc, resolveRt }
    );

    // No title anywhere, so RT/MC shouldn't be called at all
    expect(result.imdb).toBeNull();
    expect(result.rt).toBeNull();
    expect(result.mc).toBeNull();
    expect(resolveImdb).toHaveBeenCalledTimes(1);
    expect(resolveRt).not.toHaveBeenCalled();
    expect(resolveMc).not.toHaveBeenCalled();
  });

  /* ── No H1 title AND IMDb has no title ─────────── */

  it("returns nulls for RT/MC when neither H1 nor IMDb provides title (t6)", async () => {
    const resolveImdb = vi
      .fn()
      .mockResolvedValue(makeImdbResult({ title: null }));
    const resolveRt = vi.fn();
    const resolveMc = vi.fn();

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0111161" }),
      { resolveImdb, resolveMc, resolveRt }
    );

    expect(result.imdb).toEqual(makeImdbResult({ title: null }));
    expect(result.rt).toBeNull();
    expect(result.mc).toBeNull();
    // RT/MC should not be called because IMDb has no title either
    expect(resolveRt).not.toHaveBeenCalled();
    expect(resolveMc).not.toHaveBeenCalled();
  });

  /* ── Fallback path: RT rejects, MC succeeds ───── */

  it("fallback path isolates errors: RT reject, MC succeeds (t7)", async () => {
    const resolveImdb = vi
      .fn()
      .mockResolvedValue(makeImdbResult({ title: "The Fallback Movie" }));
    const resolveRt = vi.fn().mockRejectedValue(new Error("RT not found"));
    const resolveMc = vi.fn().mockResolvedValue(makeMcRating());

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0000001" }),
      { resolveImdb, resolveMc, resolveRt }
    );

    expect(result.imdb).toEqual(
      makeImdbResult({ title: "The Fallback Movie" })
    );
    expect(result.rt).toBeNull();
    expect(result.mc).toEqual(makeMcRating());
  });
});
