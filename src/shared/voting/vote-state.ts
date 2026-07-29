import type { Cache } from "@/shared/utils/cache";

export type VotePersistOptions = { persist?: boolean };
export type VoteApi<State, Dir extends string, Item, Result> = {
  initial: (item: Item) => State;
  key: (item: Item) => string;
  optimistic: (state: State, dir: Dir) => State;
  persist: (item: Item, state: State) => void;
  resolve: (optimistic: State, dir: Dir, result: Result) => State;
  serverInitial: (item: Item) => State;
  toItem: (item: Item, state: State) => Item;
  votedOf: (state: State) => Dir | null;
};
type PersistenceConfig<State, Stored> = {
  cache: Cache<Stored>;
  hydrate: (stored: Stored) => Partial<State>;
  serialize: (state: State) => Stored;
};
export type VoteStateConfig<State, Dir extends string, Item, Result, Stored> = {
  countKey: (dir: Dir) => keyof State & string;
  initial: (item: Item) => State;
  key: (item: Item) => string;
  mergeResult: (state: State, dir: Dir, result: Result) => State;
  persistence?: PersistenceConfig<State, Stored>;
  toItem: (item: Item, state: State) => Item;
  votedOf: (state: State) => Dir | null;
  withVoted: (state: State, dir: Dir | null) => State;
};
const createVoteState = <State, Dir extends string, Item, Result, Stored>(
  config: VoteStateConfig<State, Dir, Item, Result, Stored>
): VoteApi<State, Dir, Item, Result> => {
  const initial = (item: Item): State => {
    const base = config.initial(item);
    const stored = config.persistence?.cache.get(config.key(item));
    return stored && config.persistence
      ? { ...base, ...config.persistence.hydrate(stored) }
      : base;
  };
  return {
    initial,
    key: config.key,
    optimistic: (state, dir) =>
      config.withVoted(
        {
          ...state,
          [config.countKey(dir)]: (state[config.countKey(dir)] as number) + 1,
        } as State,
        dir
      ),
    persist: (item, state) => {
      const { persistence } = config;
      if (persistence && config.votedOf(state)) {
        persistence.cache.set(config.key(item), persistence.serialize(state));
      }
    },
    resolve: config.mergeResult,
    serverInitial: config.initial,
    toItem: config.toItem,
    votedOf: config.votedOf,
  };
};
export { createVoteState };
