import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVoteState } from "@/modules/subject-page/use-vote-state";
import type { VoteStateStrategy } from "@/modules/subject-page/use-vote-state";

type TestItem = {
  count: number;
  id: string;
  label: string;
};

type TestVoteState = {
  count: number;
  voted: boolean;
};

const testStrategy: VoteStateStrategy<TestItem, TestVoteState> = {
  initial: (item) => ({
    count: item.count,
    voted: false,
  }),
  key: (item) => item.id,
  merge: (item, state) => ({
    ...item,
    count: state.count,
  }),
};

const items: TestItem[] = [
  { count: 1, id: "a", label: "Alpha" },
  { count: 2, id: "b", label: "Beta" },
];

const TestHarness = ({
  persist,
}: {
  persist?: VoteStateStrategy<TestItem, TestVoteState>["persist"];
}) => {
  const votes = useVoteState(items, {
    ...testStrategy,
    persist,
  });
  const firstState = votes.getVoteState(items[0]);
  const secondState = votes.getVoteState(items[1]);
  const mergedFirst = votes.mergeVoteState(items[0]);

  return (
    <div>
      <button
        data-testid="update-first"
        onClick={() => votes.setVoteState(items[0], { count: 10, voted: true })}
        type="button"
      >
        update first
      </button>
      <button
        data-testid="persist-first"
        onClick={() =>
          votes.setVoteState(
            items[0],
            { count: 12, voted: true },
            { persist: true }
          )
        }
        type="button"
      >
        persist first
      </button>
      <span data-testid="first-state">
        {firstState.count}:{String(firstState.voted)}
      </span>
      <span data-testid="second-state">
        {secondState.count}:{String(secondState.voted)}
      </span>
      <span data-testid="merged-first">{mergedFirst.count}</span>
    </div>
  );
};

const renderHarness = (
  persist?: VoteStateStrategy<TestItem, TestVoteState>["persist"]
): HTMLElement => {
  const root = document.createElement("div");
  render(<TestHarness persist={persist} />, root);
  return root;
};

describe(useVoteState, () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes vote state by item key", () => {
    const root = renderHarness();

    expect(root.querySelector('[data-testid="first-state"]')?.textContent).toBe(
      "1:false"
    );
    expect(
      root.querySelector('[data-testid="second-state"]')?.textContent
    ).toBe("2:false");
  });

  it("updates one keyed item without changing sibling state", async () => {
    const root = renderHarness();

    root
      .querySelector<HTMLButtonElement>('[data-testid="update-first"]')
      ?.click();
    await Promise.resolve();

    expect(root.querySelector('[data-testid="first-state"]')?.textContent).toBe(
      "10:true"
    );
    expect(
      root.querySelector('[data-testid="second-state"]')?.textContent
    ).toBe("2:false");
  });

  it("merges current vote state into the item", async () => {
    const root = renderHarness();

    root
      .querySelector<HTMLButtonElement>('[data-testid="update-first"]')
      ?.click();
    await Promise.resolve();

    expect(
      root.querySelector('[data-testid="merged-first"]')?.textContent
    ).toBe("10");
  });

  it("persists only when requested", async () => {
    const persist = vi.fn<(item: TestItem, state: TestVoteState) => void>();
    const root = renderHarness(persist);

    root
      .querySelector<HTMLButtonElement>('[data-testid="update-first"]')
      ?.click();
    root
      .querySelector<HTMLButtonElement>('[data-testid="persist-first"]')
      ?.click();
    await Promise.resolve();

    expect(persist).toHaveBeenCalledExactlyOnceWith(items[0], {
      count: 12,
      voted: true,
    });
  });
});
