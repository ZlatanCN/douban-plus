import { useCallback, useState } from "preact/hooks";

import type { VotePersistOptions } from "./vote-state";

type VoteTransitionApi<State, Dir extends string, Result> = {
  optimistic: (state: State, dir: Dir) => State;
  resolve: (optimistic: State, dir: Dir, result: Result) => State;
  votedOf: (state: State) => Dir | null;
};

type VoteActionWiring<State, Dir extends string, Result> = {
  canVote?: () => boolean;
  getState: () => State;
  onVote: (dir: Dir) => Promise<Result>;
  setState: (next: State, options?: VotePersistOptions) => void;
};

/**
 * Single source of truth for the optimistic → await → resolve/rollback
 * orchestration. Consumes only the three pure transition functions it needs
 * (a structural subset of VoteApi), so callers pass a VoteApi product and this
 * hook never touches the key/initial/toItem/persist half it doesn't own.
 */
const useVoteAction = <
  State,
  Dir extends string,
  Result extends { ok: boolean },
>(
  api: VoteTransitionApi<State, Dir, Result>,
  wiring: VoteActionWiring<State, Dir, Result>
) => {
  const { canVote, getState, onVote, setState } = wiring;
  const [loading, setLoading] = useState(false);

  const vote = useCallback(
    async (dir: Dir): Promise<void> => {
      if (loading || api.votedOf(getState()) === dir) {
        return;
      }
      if (canVote && !canVote()) {
        return;
      }

      const previous = getState();
      setLoading(true);
      const optimisticState = api.optimistic(previous, dir);
      setState(optimisticState);
      const result = await onVote(dir);
      if (result.ok) {
        setState(api.resolve(optimisticState, dir, result), {
          persist: true,
        });
      } else {
        setState(previous);
      }
      setLoading(false);
    },
    [api, canVote, getState, loading, onVote, setState]
  );

  return { loading, vote };
};

export { useVoteAction };
export type { VoteActionWiring, VoteTransitionApi };
