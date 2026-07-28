import { render } from "preact";
import { useState } from "preact/hooks";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVoteControl } from "@/modules/subject/voting/use-vote-control";
import type { VoteApi } from "@/modules/subject/voting/vote-state";

type TestItem = { count: number; id: string };
type TestState = { count: number; voted: boolean };
type TestResult = { ok: boolean };

const item: TestItem = { count: 5, id: "vote-1" };

const makeApi = (
  persist: (item: TestItem, state: TestState) => void
): VoteApi<TestState, "up", TestItem, TestResult> => ({
  initial: (nextItem) => ({ count: nextItem.count, voted: false }),
  key: (nextItem) => nextItem.id,
  optimistic: (state) => ({ ...state, count: state.count + 1, voted: true }),
  persist,
  resolve: (state) => state,
  serverInitial: (nextItem) => ({ count: nextItem.count, voted: false }),
  toItem: (nextItem, state) => ({ ...nextItem, count: state.count }),
  votedOf: (state) => (state.voted ? "up" : null),
});

const StandaloneHarness = ({
  persist,
}: {
  persist: (item: TestItem, state: TestState) => void;
}) => {
  const { setVoteState, voteState } = useVoteControl({
    api: makeApi(persist),
    item,
  });

  return (
    <div>
      <button
        data-testid="update"
        onClick={() =>
          setVoteState({ count: 9, voted: true }, { persist: true })
        }
        type="button"
      >
        update
      </button>
      <span data-testid="state">
        {voteState.count}:{String(voteState.voted)}
      </span>
    </div>
  );
};

const ControlledHarness = ({
  onStateChange,
  persist,
}: {
  onStateChange: (state: TestState) => void;
  persist: (item: TestItem, state: TestState) => void;
}) => {
  const [state, setState] = useState<TestState>({ count: 5, voted: false });
  const { setVoteState, voteState } = useVoteControl({
    api: makeApi(persist),
    item,
    onStateChange: (nextState) => {
      onStateChange(nextState);
      setState(nextState);
    },
    state,
  });

  return (
    <div>
      <button
        data-testid="update"
        onClick={() =>
          setVoteState({ count: 9, voted: true }, { persist: true })
        }
        type="button"
      >
        update
      </button>
      <span data-testid="state">
        {voteState.count}:{String(voteState.voted)}
      </span>
    </div>
  );
};

const renderHarness = (element: preact.VNode): HTMLElement => {
  const root = document.createElement("div");
  render(element, root);
  return root;
};

describe(useVoteControl, () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("owns standalone state and persists only requested changes", async () => {
    const persist = vi.fn<(item: TestItem, state: TestState) => void>();
    const root = renderHarness(<StandaloneHarness persist={persist} />);

    root.querySelector<HTMLButtonElement>('[data-testid="update"]')?.click();
    await Promise.resolve();

    expect(root.querySelector('[data-testid="state"]')?.textContent).toBe(
      "9:true"
    );
    expect(persist).toHaveBeenCalledExactlyOnceWith(item, {
      count: 9,
      voted: true,
    });
  });

  it("delegates controlled changes without persisting them locally", async () => {
    const onStateChange = vi.fn<(state: TestState) => void>();
    const persist = vi.fn<(item: TestItem, state: TestState) => void>();
    const root = renderHarness(
      <ControlledHarness onStateChange={onStateChange} persist={persist} />
    );

    root.querySelector<HTMLButtonElement>('[data-testid="update"]')?.click();
    await Promise.resolve();

    expect(onStateChange).toHaveBeenCalledExactlyOnceWith({
      count: 9,
      voted: true,
    });
    expect(persist).not.toHaveBeenCalled();
    expect(root.querySelector('[data-testid="state"]')?.textContent).toBe(
      "9:true"
    );
  });
});
