import { useCallback, useState } from "preact/hooks";

import type { VotePersistOptions } from "./vote-state";

type UseVoteActionParams<State, Dir extends string, Result> = {
  canVote?: () => boolean;
  getState: () => State;
  onVote: (dir: Dir) => Promise<Result>;
  optimistic: (state: State, dir: Dir) => State;
  resolve: (optimistic: State, dir: Dir, result: Result) => State;
  setState: (next: State, options?: VotePersistOptions) => void;
  votedOf: (state: State) => Dir | null;
};

/**
 * Single source of truth for the optimistic → await → resolve/rollback
 * orchestration that used to live (duplicated and untested) inside each vote
 * button. The state transitions are pure functions passed in via the config,
 * so this hook only owns the async glue and the loading flag.
 */
const useVoteAction = <
  State,
  Dir extends string,
  Result extends { ok: boolean },
>({
  canVote,
  getState,
  onVote,
  optimistic,
  resolve,
  setState,
  votedOf,
}: UseVoteActionParams<State, Dir, Result>) => {
  const [loading, setLoading] = useState(false);

  const vote = useCallback(
    async (dir: Dir): Promise<void> => {
      if (loading || votedOf(getState()) === dir) {
        return;
      }
      if (canVote && !canVote()) {
        return;
      }

      const previous = getState();
      setLoading(true);
      const optimisticState = optimistic(previous, dir);
      setState(optimisticState);
      const result = await onVote(dir);
      if (result.ok) {
        setState(resolve(optimisticState, dir, result), { persist: true });
      } else {
        setState(previous);
      }
      setLoading(false);
    },
    [canVote, getState, loading, onVote, optimistic, resolve, setState, votedOf]
  );

  return { loading, vote };
};

export { useVoteAction };
