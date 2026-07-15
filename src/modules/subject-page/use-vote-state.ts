import { useState } from "preact/hooks";

import type { VoteApi, VotePersistOptions } from "./vote-state";

const toInitialStates = <State, Dir extends string, Item, Result>(
  items: readonly Item[],
  api: VoteApi<State, Dir, Item, Result>
): Record<string, State> =>
  Object.fromEntries(items.map((item) => [api.key(item), api.initial(item)]));

/**
 * Owns the keyed vote-state map for a collection of items. Consumes a single
 * {@link VoteApi} (the product of `createVoteState`) so the pure state machine
 * and the Preact lifecycle share one owner — callers no longer hand-assemble a
 * separate strategy shape from the factory's products.
 */
const useVoteState = <State, Dir extends string, Item, Result>(
  items: readonly Item[],
  api: VoteApi<State, Dir, Item, Result>
) => {
  const [states, setStates] = useState<Record<string, State>>(() =>
    toInitialStates(items, api)
  );

  const getVoteState = (item: Item): State =>
    states[api.key(item)] ?? api.initial(item);

  const setVoteState = (
    item: Item,
    state: State,
    options?: VotePersistOptions
  ): void => {
    setStates((current) => ({
      ...current,
      [api.key(item)]: state,
    }));
    if (options?.persist) {
      api.persist(item, state);
    }
  };

  const mergeVoteState = (item: Item): Item =>
    api.toItem(item, getVoteState(item));

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
