/* ── resolveAll — Orchestrator Tests ────────────────────── */

import { describe, expect, it, vi, beforeEach } from "vitest";

import type { FetchImdbResult } from "@/modules/subject/api/imdb";
import type { McRating, RtRating } from "@/modules/subject/domain";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

// Mock request utils to prevent GM_xmlhttpRequest check from firing
// during module import chain resolution.
vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGet: vi.fn<(url: string, referer?: string) => Promise<string>>(),
  gmPost:
    vi.fn<(url: string, data: string, referer?: string) => Promise<string>>(),
}));

const mockFetchImdbRating = vi.hoisted(() =>
  vi.fn<(imdbId: string, season?: number) => Promise<FetchImdbResult>>()
);
const mockFetchRtRating = vi.hoisted(() =>
  vi.fn<
    (
      title: string,
      isTV?: boolean,
      season?: number,
      year?: string
    ) => Promise<RtRating | null>
  >()
);
const mockFetchMcRating = vi.hoisted(() =>
  vi.fn<
    (
      title: string,
      isTV?: boolean,
      season?: number,
      year?: string
    ) => Promise<McRating | null>
  >()
);

vi.mock(import("../../src/modules/subject/api/imdb"), () => ({
  fetchImdbRating: mockFetchImdbRating,
}));
vi.mock(import("../../src/modules/subject/api/metacritic"), () => ({
  fetchMcRating: mockFetchMcRating,
}));
vi.mock(import("../../src/modules/subject/api/rotten"), () => ({
  fetchRtRating: mockFetchRtRating,
}));

// Import after all mocks are set up.
const { resolveAll } =
  await import("../../src/modules/subject/resolve/orchestrate");

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
  beforeEach(() => {
    mockFetchImdbRating.mockReset().mockResolvedValue(makeImdbResult());
    mockFetchRtRating.mockReset().mockResolvedValue(makeRtRating());
    mockFetchMcRating.mockReset().mockResolvedValue(makeMcRating());
  });

  it("fetches all three in parallel when englishTitle is available (t1)", async () => {
    await resolveAll(
      makeCtx({
        englishTitle: "The Shawshank Redemption",
        imdbId: "tt0111161",
        season: 1,
        year: "1994",
      })
    );

    expect(mockFetchImdbRating).toHaveBeenCalledWith("tt0111161", 1);
    expect(mockFetchRtRating).toHaveBeenCalledWith(
      "The Shawshank Redemption",
      false,
      1,
      "1994"
    );
    expect(mockFetchMcRating).toHaveBeenCalledWith(
      "The Shawshank Redemption",
      false,
      1,
      "1994"
    );
  });

  it("returns all three resolved results when englishTitle is available (t1b)", async () => {
    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Shawshank Redemption",
        imdbId: "tt0111161",
      })
    );

    expect(result.imdb).toStrictEqual(makeImdbResult());
    expect(result.rt).toStrictEqual(makeRtRating());
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("resolves RT/MC after IMDb when no H1 title but IMDb has title (t2)", async () => {
    mockFetchImdbRating.mockResolvedValue(
      makeImdbResult({ title: "Inception" })
    );

    await resolveAll(
      makeCtx({
        englishTitle: null,
        imdbId: "tt1375666",
      })
    );

    expect(mockFetchImdbRating).toHaveBeenCalledWith("tt1375666", undefined);
    expect(mockFetchRtRating).toHaveBeenCalledWith(
      "Inception",
      false,
      undefined,
      undefined
    );
    expect(mockFetchMcRating).toHaveBeenCalledWith(
      "Inception",
      false,
      undefined,
      undefined
    );
  });

  it("returns results when RT/MC resolved via IMDb fallback (t2b)", async () => {
    mockFetchImdbRating.mockResolvedValue(
      makeImdbResult({ title: "Inception" })
    );

    const result = await resolveAll(
      makeCtx({
        englishTitle: null,
        imdbId: "tt1375666",
      })
    );

    expect(result.imdb).toStrictEqual(makeImdbResult({ title: "Inception" }));
    expect(result.rt).toStrictEqual(makeRtRating());
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("isolates errors: one rejected fetch does not block others (t3)", async () => {
    mockFetchImdbRating.mockRejectedValue(new Error("IMDb network error"));

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Matrix",
        imdbId: "tt0133093",
      })
    );

    expect(result.imdb).toBeNull();
    expect(result.rt).toStrictEqual(makeRtRating());
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("isolates errors: RT failure still returns IMDb and MC (t4)", async () => {
    mockFetchRtRating.mockRejectedValue(new Error("RT error"));

    const result = await resolveAll(
      makeCtx({
        englishTitle: "The Matrix",
        imdbId: "tt0133093",
      })
    );

    expect(result.imdb).toStrictEqual(makeImdbResult());
    expect(result.rt).toBeNull();
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("returns all nulls when no identifiers available (t5)", async () => {
    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: null })
    );

    expect(result.imdb).toBeNull();
    expect(result.rt).toBeNull();
    expect(result.mc).toBeNull();
  });

  it("does not call fetch adapters when no identifiers are available (t5b)", async () => {
    await resolveAll(makeCtx({ englishTitle: null, imdbId: null }));

    expect(mockFetchImdbRating).not.toHaveBeenCalled();
    expect(mockFetchRtRating).not.toHaveBeenCalled();
    expect(mockFetchMcRating).not.toHaveBeenCalled();
  });

  it("returns nulls for RT/MC when neither H1 nor IMDb provides title (t6)", async () => {
    mockFetchImdbRating.mockResolvedValue(makeImdbResult({ title: null }));

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0111161" })
    );

    expect(result.imdb).toStrictEqual(makeImdbResult({ title: null }));
    expect(result.rt).toBeNull();
    expect(result.mc).toBeNull();
    expect(mockFetchRtRating).not.toHaveBeenCalled();
    expect(mockFetchMcRating).not.toHaveBeenCalled();
  });

  it("fallback path isolates errors: RT reject, MC succeeds (t7)", async () => {
    mockFetchImdbRating.mockResolvedValue(
      makeImdbResult({ title: "The Fallback Movie" })
    );
    mockFetchRtRating.mockRejectedValue(new Error("RT not found"));

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0000001" })
    );

    expect(result.imdb).toStrictEqual(
      makeImdbResult({ title: "The Fallback Movie" })
    );
    expect(result.rt).toBeNull();
    expect(result.mc).toStrictEqual(makeMcRating());
  });

  it("fallback path isolates IMDb rejection when no H1 title exists (t8)", async () => {
    mockFetchImdbRating.mockRejectedValue(new Error("IMDb unavailable"));

    const result = await resolveAll(
      makeCtx({ englishTitle: null, imdbId: "tt0000001" })
    );

    expect(result).toStrictEqual({ imdb: null, mc: null, rt: null });
    expect(mockFetchRtRating).not.toHaveBeenCalled();
    expect(mockFetchMcRating).not.toHaveBeenCalled();
  });
});
