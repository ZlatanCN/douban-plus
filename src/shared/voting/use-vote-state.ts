import { useEffect, useState } from "preact/hooks";

import type { VoteApi, VotePersistOptions } from "./vote-state";

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
const useVoteState = <State, Dir extends string, Item, Result>(
  items: readonly Item[],
  api: VoteApi<State, Dir, Item, Result>
) => {
  const [states, setStates] = useState<Record<string, State>>(() =>
    Object.fromEntries(items.map((item) => [api.key(item), api.initial(item)]))
  );
  const [previous, setPrevious] = useState(items);
  useEffect(() => {
    const unchanged =
      previous.length === items.length &&
      previous.every(
        (item, index) =>
          api.key(item) === api.key(items[index] as Item) &&
          same(api.serverInitial(item), api.serverInitial(items[index] as Item))
      );
    if (!unchanged) {
      setPrevious(items);
      setStates(
        Object.fromEntries(
          items.map((item) => [api.key(item), api.serverInitial(item)])
        )
      );
    }
  }, [api, items, previous]);
  const getVoteState = (item: Item): State =>
    states[api.key(item)] ?? api.initial(item);
  const setVoteState = (
    item: Item,
    state: State,
    options?: VotePersistOptions
  ): void => {
    setStates((current) => ({ ...current, [api.key(item)]: state }));
    if (options?.persist) {
      api.persist(item, state);
    }
  };
  const mergeVoteState = (item: Item): Item =>
    api.toItem(item, getVoteState(item));
  return {
    getVoteState,
    mergeVoteState,
    mergeVoteStates: (next: readonly Item[]) => next.map(mergeVoteState),
    setVoteState,
  };
};
export { useVoteState };
