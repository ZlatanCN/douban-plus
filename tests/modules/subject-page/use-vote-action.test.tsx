import { render } from "preact";
import { useState } from "preact/hooks";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVoteAction } from "@/modules/subject-page/use-vote-action";
import type { VoteTransitionApi } from "@/modules/subject-page/use-vote-action";

type State = { count: number; voted: "up" | null };
type Result = { ok: boolean; count?: number };

const api: VoteTransitionApi<State, "up", Result> = {
  optimistic: (s) => ({ ...s, count: s.count + 1, voted: "up" }),
  resolve: (s, _d, r) => ({ ...s, count: r.count ?? s.count, voted: "up" }),
  votedOf: (s) => s.voted,
};

const TestHarness = ({
  onVote,
}: {
  onVote: (dir: "up") => Promise<Result>;
}) => {
  const [state, setState] = useState<State>({ count: 5, voted: null });
  const { loading, vote } = useVoteAction(api, {
    getState: () => state,
    onVote,
    setState: (next) => setState(next),
  });

  return (
    <div>
      <button
        data-testid="vote"
        disabled={loading}
        onClick={() => void vote("up")}
        type="button"
      >
        vote
      </button>
      <span data-testid="state">
        {state.count}:{String(state.voted)}:{String(loading)}
      </span>
    </div>
  );
};

const renderHarness = (onVote: (dir: "up") => Promise<Result>): HTMLElement => {
  const root = document.createElement("div");
  render(<TestHarness onVote={onVote} />, root);
  return root;
};

describe("useVoteAction orchestration", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("applies optimistic state then resolves to the server count", async () => {
    const onVote = vi.fn<(dir: "up") => Promise<Result>>(() =>
      Promise.resolve({ count: 12, ok: true })
    );
    const root = renderHarness(onVote);

    root.querySelector<HTMLButtonElement>('[data-testid="vote"]')?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(root.querySelector('[data-testid="state"]')?.textContent).toBe(
      "12:up:false"
    );
    expect(onVote).toHaveBeenCalledOnce();
  });

  it("rolls back to the previous state when the server rejects", async () => {
    const onVote = vi.fn<(dir: "up") => Promise<Result>>(() =>
      Promise.resolve({ ok: false })
    );
    const root = renderHarness(onVote);

    root.querySelector<HTMLButtonElement>('[data-testid="vote"]')?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(root.querySelector('[data-testid="state"]')?.textContent).toBe(
      "5:null:false"
    );
  });

  it("ignores a second vote on the same direction", async () => {
    const onVote = vi.fn<(dir: "up") => Promise<Result>>(() =>
      Promise.resolve({ count: 12, ok: true })
    );
    const root = renderHarness(onVote);

    const button = root.querySelector<HTMLButtonElement>(
      '[data-testid="vote"]'
    );
    button?.click();
    await Promise.resolve();
    await Promise.resolve();
    button?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onVote).toHaveBeenCalledOnce();
    expect(root.querySelector('[data-testid="state"]')?.textContent).toBe(
      "12:up:false"
    );
  });
});
