/* ── resolveAll — Orchestrator Tests ────────────────────── */

import { describe, expect, it, vi } from "vitest";

import type { FetchImdbResult } from "@/api/imdb";
import type { ResolutionContext } from "@/resolve/types";
import type { McRating, RtRating } from "@/types";

// Mock request utils to prevent GM_xmlhttpRequest check from firing
// during module import chain resolution.
vi.mock(import("../../src/utils/request"), () => ({
  gmGet: vi.fn<(url: string, referer?: string) => Promise<string>>(),
  gmPost:
    vi.fn<(url: string, data: string, referer?: string) => Promise<string>>(),
}));

// Import after all mocks are set up.
const { resolveAll } = await import("../../src/resolve/orchestrate");

type FetchImdbRating = (
  imdbId: string,
  season?: number
) => Promise<FetchImdbResult>;
type FetchRtRating = (
  title: string,
  isTV?: boolean,
  season?: number,
  year?: string
) => Promise<RtRating | null>;
type FetchMcRating = (
  title: string,
  isTV?: boolean,
  season?: number,
  year?: string
) => Promise<McRating | null>;
type ResolveAllDeps = NonNullable<Parameters<typeof resolveAll>[1]>;

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

const makeDeps = (overrides?: Partial<ResolveAllDeps>): ResolveAllDeps => ({
  fetchImdbRating: vi.fn<FetchImdbRating>().mockResolvedValue(makeImdbResult()),
  fetchMcRating: vi.fn<FetchMcRating>().mockResolvedValue(makeMcRating()),
  fetchRtRating: vi.fn<FetchRtRating>().mockResolvedValue(makeRtRating()),
  ...overrides,
});

/* ── Suite ────────────────────────────────────────────── */

describe("resolveAll", () => {
  it("fetches all three in parallel when englishTitle is available (t1)", async () => {
    const deps = makeDeps();

    await resolveAll(
      makeCtx({
        englishTitle: "The Shawshank Redemption",
        imdbId: "tt0111161",
        season: 1,
        year: "1994",
      }),
      deps
    );

    expect(deps.fetchImdbRating).toHaveBeenCalledWith("tt0111161", 1);
    expect(deps.fetchRtRating).toHaveBeenCalledWith(
      "The Shawshank Redemption",
      false,
      1,
      "1994"
    );
    expect(deps.fetchMcRating).toHaveBeenCalledWith(
      "The Shawshank Redemption",
      false,
      1,
      "1994"
    );
  });

  it("returns all three resolved results when englishTitle is available (t1b)", async () => {
    const deps = makeDeps();

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Shawshank Redemption",
        imdbId: "tt0111161",
      }),
      deps
    );

    expect(result.imdb).toStrictEqual(makeImdbResult());
    expect(result.rt).toStrictEqual(makeRtRating());
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("resolves RT/MC after IMDb when no H1 title but IMDb has title (t2)", async () => {
    const deps = makeDeps({
      fetchImdbRating: vi
        .fn<FetchImdbRating>()
        .mockResolvedValue(makeImdbResult({ title: "Inception" })),
    });

    await resolveAll(
      makeCtx({
        englishTitle: null,
        imdbId: "tt1375666",
      }),
      deps
    );

    expect(deps.fetchImdbRating).toHaveBeenCalledWith("tt1375666", undefined);
    expect(deps.fetchRtRating).toHaveBeenCalledWith(
      "Inception",
      false,
      undefined,
      undefined
    );
    expect(deps.fetchMcRating).toHaveBeenCalledWith(
      "Inception",
      false,
      undefined,
      undefined
    );
  });

  it("returns results when RT/MC resolved via IMDb fallback (t2b)", async () => {
    const deps = makeDeps({
      fetchImdbRating: vi
        .fn<FetchImdbRating>()
        .mockResolvedValue(makeImdbResult({ title: "Inception" })),
    });

    const result = await resolveAll(
      makeCtx({
        englishTitle: null,
        imdbId: "tt1375666",
      }),
      deps
    );

    expect(result.imdb).toStrictEqual(makeImdbResult({ title: "Inception" }));
    expect(result.rt).toStrictEqual(makeRtRating());
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("isolates errors: one rejected fetch does not block others (t3)", async () => {
    const deps = makeDeps({
      fetchImdbRating: vi
        .fn<FetchImdbRating>()
        .mockRejectedValue(new Error("IMDb network error")),
    });

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Matrix",
        imdbId: "tt0133093",
      }),
      deps
    );

    expect(result.imdb).toBeNull();
    expect(result.rt).toStrictEqual(makeRtRating());
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("isolates errors: RT failure still returns IMDb and MC (t4)", async () => {
    const deps = makeDeps({
      fetchRtRating: vi
        .fn<FetchRtRating>()
        .mockRejectedValue(new Error("RT error")),
    });

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Matrix",
        imdbId: "tt0133093",
      }),
      deps
    );

    expect(result.imdb).toStrictEqual(makeImdbResult());
    expect(result.rt).toBeNull();
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("returns all nulls when no identifiers available (t5)", async () => {
    const deps = makeDeps();

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: null }),
      deps
    );

    expect(result.imdb).toBeNull();
    expect(result.rt).toBeNull();
    expect(result.mc).toBeNull();
  });

  it("does not call fetch adapters when no identifiers are available (t5b)", async () => {
    const deps = makeDeps();

    await resolveAll(makeCtx({ englishTitle: null, imdbId: null }), deps);

    expect(deps.fetchImdbRating).not.toHaveBeenCalled();
    expect(deps.fetchRtRating).not.toHaveBeenCalled();
    expect(deps.fetchMcRating).not.toHaveBeenCalled();
  });

  it("returns nulls for RT/MC when neither H1 nor IMDb provides title (t6)", async () => {
    const deps = makeDeps({
      fetchImdbRating: vi
        .fn<FetchImdbRating>()
        .mockResolvedValue(makeImdbResult({ title: null })),
    });

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0111161" }),
      deps
    );

    expect(result.imdb).toStrictEqual(makeImdbResult({ title: null }));
    expect(result.rt).toBeNull();
    expect(result.mc).toBeNull();
    expect(deps.fetchRtRating).not.toHaveBeenCalled();
    expect(deps.fetchMcRating).not.toHaveBeenCalled();
  });

  it("fallback path isolates errors: RT reject, MC succeeds (t7)", async () => {
    const deps = makeDeps({
      fetchImdbRating: vi
        .fn<FetchImdbRating>()
        .mockResolvedValue(makeImdbResult({ title: "The Fallback Movie" })),
      fetchRtRating: vi
        .fn<FetchRtRating>()
        .mockRejectedValue(new Error("RT not found")),
    });

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0000001" }),
      deps
    );

    expect(result.imdb).toStrictEqual(
      makeImdbResult({ title: "The Fallback Movie" })
    );
    expect(result.rt).toBeNull();
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("fallback path isolates IMDb rejection when no H1 title exists (t8)", async () => {
    const deps = makeDeps({
      fetchImdbRating: vi
        .fn<FetchImdbRating>()
        .mockRejectedValue(new Error("IMDb unavailable")),
    });

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0000001" }),
      deps
    );

    expect(result).toStrictEqual({ imdb: null, mc: null, rt: null });
    expect(deps.fetchRtRating).not.toHaveBeenCalled();
    expect(deps.fetchMcRating).not.toHaveBeenCalled();
  });
});
