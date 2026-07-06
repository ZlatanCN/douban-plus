/* ── buildVoteBtn — Unit Tests ──────────────────────────── */
/* Tests the standalone vote button builder extracted from   */
/* the comments module (optimistic update + API rollback).   */

import { describe, it, expect, vi, afterEach } from "vitest";

import { buildVoteBtn } from "../../src/components/vote-btn";

/* ── Factory helpers ─────────────────────────────────────── */

type VoteBtnOptions = {
  cid: string;
  count: number;
  voted: boolean;
  className: string;
  onVote: (cid: string) => Promise<{ ok: boolean; count?: number }>;
};

const makeOptions = (overrides?: Partial<VoteBtnOptions>): VoteBtnOptions => ({
  cid: "c1",
  className: "atv-comment-votes",
  count: 5,
  onVote: vi.fn().mockResolvedValue({ count: 6, ok: true }),
  voted: false,
  ...overrides,
});

/* ── Stub RAF to fire synchronously ────────────────────── */
/* The click handler calls requestAnimationFrame for the     */
/* scale animation; stub it so no timers are needed.         */
const stubRaf = (): void => {
  /* eslint-disable promise/prefer-await-to-callbacks — RAF is a callback API */
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(
    (cb: FrameRequestCallback): number => {
      cb(0);
      return 0;
    }
  );
  /* eslint-enable promise/prefer-await-to-callbacks */
};

/* ── Tests ───────────────────────────────────────────────── */

describe("buildVoteBtn(options)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ── t1: Display count ──────────────────────────────── */

  it("displays the initial vote count in button text (t1)", () => {
    const btn = buildVoteBtn(makeOptions({ count: 5 }));
    expect(btn.textContent).toContain("5");
  });

  /* ── t2: Initial voted=true ────────────────────────── */

  it("has is-voted class when created with voted: true (t2)", () => {
    const btn = buildVoteBtn(makeOptions({ voted: true }));
    expect(btn.classList.contains("is-voted")).toBe(true);
  });

  /* ── t3: Initial voted=false ───────────────────────── */

  it("does NOT have is-voted class when created with voted: false (t3)", () => {
    const btn = buildVoteBtn(makeOptions({ voted: false }));
    expect(btn.classList.contains("is-voted")).toBe(false);
  });

  /* ── t4: Renders className ─────────────────────────── */

  it("renders with the caller-provided CSS class (t4)", () => {
    const btn = buildVoteBtn(makeOptions({ className: "my-vote-btn" }));
    expect(btn.classList.contains("my-vote-btn")).toBe(true);
  });

  /* ── t5: Happy path (async) ────────────────────────── */

  it("click unvoted → optimistic is-voted → API ok:true → server count 6 wins (t5)", async () => {
    stubRaf();
    const onVote = vi.fn().mockResolvedValue({ count: 6, ok: true });
    const btn = buildVoteBtn(makeOptions({ count: 5, onVote, voted: false }));

    btn.click();

    /* Optimistic: is-voted applied immediately */
    expect(btn.classList.contains("is-voted")).toBe(true);

    /* After async resolution: server count wins, is-voted remains */
    await vi.waitFor(() => {
      expect(btn.textContent).toContain("6");
    });
    expect(btn.classList.contains("is-voted")).toBe(true);
    expect(onVote).toHaveBeenCalledWith("c1");
  });

  /* ── t6: Already voted ────────────────────────────── */

  it("click when already voted does NOT call onVote and stays unchanged (t6)", async () => {
    const onVote = vi.fn();
    const btn = buildVoteBtn(makeOptions({ onVote, voted: true }));
    expect(btn.classList.contains("is-voted")).toBe(true);

    btn.click();

    /* Guard clause should return before any async call */
    expect(onVote).not.toHaveBeenCalled();
    expect(btn.classList.contains("is-voted")).toBe(true);
    /* Defensive wait: ensure no deferred call sneaks through */
    await vi.waitFor(() => {
      expect(onVote).not.toHaveBeenCalled();
    });
  });

  /* ── t7: No cid ─────────────────────────────────────── */

  it("click with empty cid does NOT call onVote and stays unchanged (t7)", async () => {
    const onVote = vi.fn();
    const btn = buildVoteBtn(makeOptions({ cid: "", onVote, voted: false }));
    expect(btn.classList.contains("is-voted")).toBe(false);

    btn.click();

    /* Guard clause should return before any async call */
    expect(onVote).not.toHaveBeenCalled();
    expect(btn.classList.contains("is-voted")).toBe(false);
    /* Defensive wait: ensure no deferred call sneaks through */
    await vi.waitFor(() => {
      expect(onVote).not.toHaveBeenCalled();
    });
  });

  /* ── t8: API failure rollback ──────────────────────── */

  it("click → optimistic is-voted → API ok:false → rollback count and is-voted (t8)", async () => {
    stubRaf();
    const onVote = vi.fn().mockResolvedValue({ ok: false });
    const btn = buildVoteBtn(makeOptions({ count: 5, onVote, voted: false }));

    btn.click();

    /* Optimistic: is-voted applied */
    expect(btn.classList.contains("is-voted")).toBe(true);

    /* After async resolution: is-voted removed, count restored */
    await vi.waitFor(() => {
      expect(btn.classList.contains("is-voted")).toBe(false);
    });
    expect(btn.textContent).toContain("5");
    expect(onVote).toHaveBeenCalledWith("c1");
  });

  /* ── t9: Server count override ─────────────────────── */

  it("API returns count=10 but initial was 5 → server value wins (t9)", async () => {
    stubRaf();
    const onVote = vi.fn().mockResolvedValue({ count: 10, ok: true });
    const btn = buildVoteBtn(makeOptions({ count: 5, onVote, voted: false }));

    btn.click();

    await vi.waitFor(() => {
      expect(btn.textContent).toContain("10");
    });
    expect(btn.classList.contains("is-voted")).toBe(true);
    expect(onVote).toHaveBeenCalledWith("c1");
  });
});
