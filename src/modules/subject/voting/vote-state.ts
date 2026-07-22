import type { Cache } from "@/shared/utils/cache";

/**
 * Pure, DOM-free vote-state machine produced by {@link createVoteState}.
 * Every transition is a pure function so it can be unit-tested without a DOM.
 */
export type VoteApi<State, Dir extends string, Item, Result> = {
  key: (item: Item) => string;
  initial: (item: Item) => State;
  optimistic: (state: State, dir: Dir) => State;
  resolve: (optimistic: State, dir: Dir, result: Result) => State;
  toItem: (item: Item, state: State) => Item;
  persist: (item: Item, state: State) => void;
  votedOf: (state: State) => Dir | null;
};

/** Options threaded through a vote-state change (e.g. whether to persist). */
export type VotePersistOptions = { persist?: boolean };

type PersistenceConfig<State, Stored> = {
  cache: Cache<Stored>;
  serialize: (state: State) => Stored;
  hydrate: (stored: Stored) => Partial<State>;
};

export type VoteStateConfig<State, Dir extends string, Item, Result, Stored> = {
  /** Maps a direction to the state property holding its running count. */
  countKey: (dir: Dir) => keyof State & string;
  /** Reads the currently active direction, or null when nothing is voted. */
  votedOf: (state: State) => Dir | null;
  /** Returns the state with the active direction set (or cleared). */
  withVoted: (state: State, dir: Dir | null) => State;
  key: (item: Item) => string;
  initial: (item: Item) => State;
  toItem: (item: Item, state: State) => Item;
  /** Applies the server result onto the optimistic state. */
  mergeResult: (state: State, dir: Dir, result: Result) => State;
  persistence?: PersistenceConfig<State, Stored>;
};

const createVoteState = <State, Dir extends string, Item, Result, Stored>(
  config: VoteStateConfig<State, Dir, Item, Result, Stored>
): VoteApi<State, Dir, Item, Result> => {
  const optimistic = (state: State, dir: Dir): State => {
    const countKey = config.countKey(dir);
    const next = {
      ...state,
      [countKey]: (state[countKey] as number) + 1,
    } as State;
    return config.withVoted(next, dir);
  };

  const resolve = (optimisticState: State, dir: Dir, result: Result): State =>
    config.mergeResult(optimisticState, dir, result);

  const initial = (item: Item): State => {
    const base = config.initial(item);
    const { persistence } = config;
    if (!persistence) {
      return base;
    }
    const stored = persistence.cache.get(config.key(item));
    return stored ? { ...base, ...persistence.hydrate(stored) } : base;
  };

  const persist = (item: Item, state: State): void => {
    const { persistence } = config;
    if (!persistence) {
      return;
    }
    const dir = config.votedOf(state);
    if (!dir) {
      return;
    }
    persistence.cache.set(config.key(item), persistence.serialize(state));
  };

  return {
    initial,
    key: config.key,
    optimistic,
    persist,
    resolve,
    toItem: config.toItem,
    votedOf: config.votedOf,
  };
};

export { createVoteState };
