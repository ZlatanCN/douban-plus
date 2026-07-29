import { useCallback, useState } from "preact/hooks";

import type { VotePersistOptions } from "./vote-state";

export type VoteTransitionApi<State, Dir extends string, Result> = {
  optimistic: (state: State, dir: Dir) => State;
  resolve: (optimistic: State, dir: Dir, result: Result) => State;
  votedOf: (state: State) => Dir | null;
};
type VoteActionWiring<State, Dir extends string, Result> = {
  getState: () => State;
  onVote: (dir: Dir) => Promise<Result>;
  setState: (next: State, options?: VotePersistOptions) => void;
};
const useVoteAction = <
  State,
  Dir extends string,
  Result extends { ok: boolean },
>(
  api: VoteTransitionApi<State, Dir, Result>,
  { getState, onVote, setState }: VoteActionWiring<State, Dir, Result>
) => {
  const [loading, setLoading] = useState(false);
  const vote = useCallback(
    async (direction: Dir): Promise<void> => {
      if (loading || api.votedOf(getState()) === direction) {
        return;
      }
      const previous = getState();
      setLoading(true);
      const optimistic = api.optimistic(previous, direction);
      setState(optimistic);
      const result = await onVote(direction);
      setState(
        result.ok ? api.resolve(optimistic, direction, result) : previous,
        result.ok ? { persist: true } : undefined
      );
      setLoading(false);
    },
    [api, getState, loading, onVote, setState]
  );
  return { loading, vote };
};
export { useVoteAction };
export type { VoteActionWiring };
