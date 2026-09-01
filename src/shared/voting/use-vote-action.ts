import { useCallback, useState } from "preact/hooks";

import type { VotePersistOptions } from "./vote-state";

type VoteTransitionApi<State, Dir extends string, Result> = {
  optimistic: (state: State, dir: Dir) => State;
  resolve: (optimistic: State, dir: Dir, result: Result) => State;
  votedOf: (state: State) => Dir | null;
};

type VoteTransitionWiring<State, Dir extends string, Result> = {
  getState: () => State;
  onVote: (dir: Dir) => Promise<Result>;
  setState: (next: State, options?: VotePersistOptions) => void;
};

/** Optimistic → await → resolve/rollback, applied against an external owner.
 *  Shared by useVoteAction (hook state) and non-hook callers. */
const runVoteTransition = async <
  State,
  Dir extends string,
  Result extends { ok: boolean },
>(
  api: VoteTransitionApi<State, Dir, Result>,
  wiring: VoteTransitionWiring<State, Dir, Result>,
  dir: Dir
): Promise<Result> => {
  const previous = wiring.getState();
  const optimisticState = api.optimistic(previous, dir);
  wiring.setState(optimisticState);
  const result = await wiring.onVote(dir);
  if (result.ok) {
    wiring.setState(api.resolve(optimisticState, dir, result), {
      persist: true,
    });
  } else {
    wiring.setState(previous);
  }
  return result;
};

type VoteActionWiring<State, Dir extends string, Result> = VoteTransitionWiring<
  State,
  Dir,
  Result
> & {
  canVote?: () => boolean;
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

      setLoading(true);
      await runVoteTransition(api, { getState, onVote, setState }, dir);
      setLoading(false);
    },
    [api, canVote, getState, loading, onVote, setState]
  );

  return { loading, vote };
};

export { runVoteTransition, useVoteAction };
export type { VoteTransitionApi };
