import { describe, expect, it } from "vitest";

import { createVoteState } from "@/modules/subject/voting/vote-state";
import type { Cache } from "@/shared/utils/cache";

type Axis = "up" | "down";
type TestState = { up: number; down: number; voted: Axis | null };
type TestResult = { ok: boolean; up?: number; down?: number };
type TestStored = { type: Axis; up?: number; down?: number };

const memoryCache = <T>(): Cache<T> => {
  const store = new Map<string, T>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
  };
};

const makeVoteState = (cache?: Cache<TestStored>) =>
  createVoteState<TestState, Axis, string, TestResult, TestStored>({
    countKey: (dir) => (dir === "up" ? "up" : "down"),
    initial: () => ({ down: 0, up: 0, voted: null }),
    key: (item) => item,
    mergeResult: (state, dir, result) => ({
      ...state,
      down: result.down ?? state.down,
      up: result.up ?? state.up,
      voted: dir,
    }),
    persistence: cache
      ? {
          cache,
          hydrate: (stored) => ({
            down: stored.down ?? 0,
            up: stored.up ?? 0,
            voted: stored.type,
          }),
          serialize: (state) => ({
            down: state.down,
            type: state.voted as Axis,
            up: state.up,
          }),
        }
      : undefined,
    toItem: (item, state) => `${item}:${state.up}:${state.down}:${state.voted}`,
    votedOf: (state) => state.voted,
    withVoted: (state, dir) => ({ ...state, voted: dir }),
  });

describe("createVoteState pure reducer", () => {
  it("optimistically increments only the chosen axis and marks the vote", () => {
    const api = makeVoteState();
    const next = api.optimistic({ down: 1, up: 3, voted: null }, "up");
    expect(next).toStrictEqual({ down: 1, up: 4, voted: "up" });
  });

  it("does not decrement the other axis when switching directions", () => {
    const api = makeVoteState();
    const switched = api.optimistic({ down: 1, up: 4, voted: "up" }, "down");
    expect(switched).toStrictEqual({ down: 2, up: 4, voted: "down" });
  });

  it("resolves to server counts while keeping the chosen direction", () => {
    const api = makeVoteState();
    const optimistic = api.optimistic({ down: 1, up: 3, voted: null }, "down");
    const resolved = api.resolve(optimistic, "down", {
      down: 9,
      ok: true,
      up: 3,
    });
    expect(resolved).toStrictEqual({ down: 9, up: 3, voted: "down" });
  });

  it("falls back to optimistic counts when the server omits a field", () => {
    const api = makeVoteState();
    const optimistic = api.optimistic({ down: 1, up: 3, voted: null }, "up");
    const resolved = api.resolve(optimistic, "up", { ok: true });
    expect(resolved).toStrictEqual({ down: 1, up: 4, voted: "up" });
  });

  it("reports the active direction via votedOf", () => {
    const api = makeVoteState();
    expect(api.votedOf({ down: 1, up: 4, voted: "up" })).toBe("up");
    expect(api.votedOf({ down: 1, up: 4, voted: null })).toBeNull();
  });

  it("hydrates initial state from a previously persisted vote", () => {
    const cache = memoryCache<TestStored>();
    const api = makeVoteState(cache);
    api.persist?.("r1", { down: 2, up: 7, voted: "up" });
    expect(api.initial("r1")).toStrictEqual({ down: 2, up: 7, voted: "up" });
  });

  it("returns the base state when nothing is cached", () => {
    const api = makeVoteState(memoryCache<TestStored>());
    expect(api.initial("r1")).toStrictEqual({ down: 0, up: 0, voted: null });
  });

  it("does not persist when no direction is active", () => {
    const cache = memoryCache<TestStored>();
    const api = makeVoteState(cache);
    api.persist?.("r1", { down: 0, up: 0, voted: null });
    expect(cache.get("r1")).toBeUndefined();
  });

  it("round-trips through serialize/hydrate", () => {
    const cache = memoryCache<TestStored>();
    const api = makeVoteState(cache);
    api.persist?.("r2", { down: 5, up: 0, voted: "down" });
    expect(api.initial("r2")).toStrictEqual({ down: 5, up: 0, voted: "down" });
  });
});
