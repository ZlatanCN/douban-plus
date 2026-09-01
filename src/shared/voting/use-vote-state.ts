import { useEffect, useState } from "preact/hooks";

import type { VoteApi, VotePersistOptions } from "./vote-state";

const toInitialStates = <State, Dir extends string, Item, Result>(
  items: readonly Item[],
  api: VoteApi<State, Dir, Item, Result>
): Record<string, State> =>
  Object.fromEntries(items.map((item) => [api.key(item), api.initial(item)]));

const toServerStates = <State, Dir extends string, Item, Result>(
  items: readonly Item[],
  api: VoteApi<State, Dir, Item, Result>
): Record<string, State> =>
  Object.fromEntries(
    items.map((item) => [api.key(item), api.serverInitial(item)])
  );

const isSameState = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }
  if (
    !left ||
    !right ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return false;
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftEntries = Object.entries(leftRecord);
  const rightEntries = Object.entries(rightRecord);
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value]) =>
        Object.hasOwn(rightRecord, key) && Object.is(value, rightRecord[key])
    )
  );
};

const hasSameServerSnapshot = <State, Dir extends string, Item, Result>(
  previous: readonly Item[],
  next: readonly Item[],
  api: VoteApi<State, Dir, Item, Result>
): boolean =>
  previous.length === next.length &&
  previous.every(
    (item, index) =>
      api.key(item) === api.key(next[index] as Item) &&
      isSameState(
        api.serverInitial(item),
        api.serverInitial(next[index] as Item)
      )
  );

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
  const [previousItems, setPreviousItems] = useState(items);

  useEffect(() => {
    if (hasSameServerSnapshot(previousItems, items, api)) {
      return;
    }
    setPreviousItems(items);
    setStates(toServerStates(items, api));
  }, [api, items, previousItems]);

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
