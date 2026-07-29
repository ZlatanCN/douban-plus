import { useState } from "preact/hooks";

import type { VoteApi, VotePersistOptions } from "./vote-state";

type VoteControlWiring<State, Dir extends string, Item, Result> = {
  api: Pick<VoteApi<State, Dir, Item, Result>, "initial" | "persist">;
  item: Item;
  onStateChange?: (state: State, options?: VotePersistOptions) => void;
  state?: State;
};
const useVoteControl = <State, Dir extends string, Item, Result>({
  api,
  item,
  onStateChange,
  state,
}: VoteControlWiring<State, Dir, Item, Result>) => {
  const [localState, setLocalState] = useState<State>(() => api.initial(item));
  const voteState = state ?? localState;
  const setVoteState = (next: State, options?: VotePersistOptions): void => {
    if (onStateChange) {
      onStateChange(next, options);
      return;
    }
    setLocalState(next);
    if (options?.persist) {
      api.persist(item, next);
    }
  };
  return { setVoteState, voteState };
};
export { useVoteControl };
export type { VoteControlWiring };
