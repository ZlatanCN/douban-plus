import { useState } from "preact/hooks";

import type { VoteApi, VotePersistOptions } from "./vote-state";

type VoteControlApi<State, Dir extends string, Item, Result> = Pick<
  VoteApi<State, Dir, Item, Result>,
  "initial" | "persist"
>;

type VoteControlWiring<State, Dir extends string, Item, Result> = {
  api: VoteControlApi<State, Dir, Item, Result>;
  item: Item;
  onStateChange?: (state: State, options?: VotePersistOptions) => void;
  state?: State;
};

/**
 * Owns one item's controlled-or-standalone vote state. Controlled callers
 * synchronize through their page-level owner; standalone callers retain and
 * persist their local state using the same VoteApi product.
 */
const useVoteControl = <State, Dir extends string, Item, Result>(
  wiring: VoteControlWiring<State, Dir, Item, Result>
) => {
  const { api, item, onStateChange, state } = wiring;
  const [localState, setLocalState] = useState<State>(() => api.initial(item));
  const voteState = state ?? localState;

  const setVoteState = (
    nextState: State,
    options?: VotePersistOptions
  ): void => {
    if (onStateChange) {
      onStateChange(nextState, options);
      return;
    }

    setLocalState(nextState);
    if (options?.persist) {
      api.persist(item, nextState);
    }
  };

  return { setVoteState, voteState };
};

export { useVoteControl };
export type { VoteControlApi, VoteControlWiring };
