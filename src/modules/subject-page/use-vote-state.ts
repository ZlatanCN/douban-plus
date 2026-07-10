import { useState } from "preact/hooks";

type VoteStateOptions = {
  persist?: boolean;
};

type VoteStateStrategy<Item, State> = {
  initial: (item: Item) => State;
  key: (item: Item) => string;
  merge: (item: Item, state: State) => Item;
  persist?: (item: Item, state: State) => void;
};

const toInitialStates = <Item, State>(
  items: readonly Item[],
  strategy: VoteStateStrategy<Item, State>
): Record<string, State> =>
  Object.fromEntries(
    items.map((item) => [strategy.key(item), strategy.initial(item)])
  );

const useVoteState = <Item, State>(
  items: readonly Item[],
  strategy: VoteStateStrategy<Item, State>
) => {
  const [states, setStates] = useState<Record<string, State>>(() =>
    toInitialStates(items, strategy)
  );

  const getVoteState = (item: Item): State =>
    states[strategy.key(item)] ?? strategy.initial(item);

  const setVoteState = (
    item: Item,
    state: State,
    options?: VoteStateOptions
  ): void => {
    setStates((current) => ({
      ...current,
      [strategy.key(item)]: state,
    }));
    if (options?.persist) {
      strategy.persist?.(item, state);
    }
  };

  const mergeVoteState = (item: Item): Item =>
    strategy.merge(item, getVoteState(item));

  const mergeVoteStates = (nextItems: readonly Item[]): Item[] =>
    nextItems.map(mergeVoteState);

  return {
    getVoteState,
    mergeVoteState,
    mergeVoteStates,
    setVoteState,
  };
};

export { useVoteState };
export type { VoteStateStrategy };
