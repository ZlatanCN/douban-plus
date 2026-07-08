/* ── createCache — Generic localStorage Cache Factory Tests ─ */
/* Tests the shared cache module used by avatar / imdb / rotten. */

import { describe, it, expect, beforeEach } from "vitest";

import { createCache } from "../../src/utils/cache";

/* ── Suite ────────────────────────────────────────────── */

describe(createCache, () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /* ── Happy path ─────────────────────────────────── */

  it("stores and retrieves a value (t1)", () => {
    const cache = createCache<string>("dp:test-cache");
    cache.set("key1", "hello");
    expect(cache.get("key1")).toBe("hello");
  });

  it("returns undefined for a key that was never set (t2)", () => {
    const cache = createCache<string>("dp:test-cache");
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  /* ── Expiry ─────────────────────────────────────── */

  it("returns undefined for an expired entry (t3)", () => {
    // Seed an expired entry directly in localStorage
    const expired = JSON.stringify([
      ["key1", { expiresAt: Date.now() - 1000, value: "old" }],
    ]);
    localStorage.setItem("dp:test-cache", expired);

    const cache = createCache<string>("dp:test-cache");
    expect(cache.get("key1")).toBeUndefined();
  });

  it("removes expired entry from localStorage on read (t4)", () => {
    const expired = JSON.stringify([
      ["key1", { expiresAt: Date.now() - 1000, value: "old" }],
    ]);
    localStorage.setItem("dp:test-cache", expired);

    const cache = createCache<string>("dp:test-cache");
    cache.get("key1");

    // Entry should have been removed
    const raw = localStorage.getItem("dp:test-cache") ?? "";
    const entries = JSON.parse(raw) as [string, unknown][];
    expect(entries).toHaveLength(0);
  });

  /* ── Corruption ─────────────────────────────────── */

  it("handles corrupted localStorage gracefully (t5)", () => {
    localStorage.setItem("dp:test-cache", "not-valid-json");

    const cache = createCache<string>("dp:test-cache");
    // Should not throw; returns undefined
    expect(cache.get("any")).toBeUndefined();
  });

  /* ── Overwrite ──────────────────────────────────── */

  it("overwrites existing key with new value (t6)", () => {
    const cache = createCache<string>("dp:test-cache");
    cache.set("key1", "first");
    cache.set("key1", "second");
    expect(cache.get("key1")).toBe("second");
  });

  /* ── Isolation ──────────────────────────────────── */

  it("does not interfere between different cache instances (t7)", () => {
    const cacheA = createCache<string>("dp:cache-a");
    const cacheB = createCache<string>("dp:cache-b");

    cacheA.set("shared-key", "from-a");
    cacheB.set("shared-key", "from-b");

    expect(cacheA.get("shared-key")).toBe("from-a");
    expect(cacheB.get("shared-key")).toBe("from-b");
  });

  it("does not read from another cache's storage key (t8)", () => {
    // Manually write to localStorage under cache-b's key
    const data = JSON.stringify([
      ["k", { expiresAt: Date.now() + 99_999, value: "secret" }],
    ]);
    localStorage.setItem("dp:cache-b", data);

    // cache-a with a different key should NOT see it
    const cacheA = createCache<string>("dp:cache-a");
    expect(cacheA.get("k")).toBeUndefined();
  });

  /* ── Complex value type ─────────────────────────── */

  it("works with object values (t9)", () => {
    type Data = {
      rating: { count: number; score: number };
      title: string;
    };
    const cache = createCache<Data>("dp:obj-cache");

    const value: Data = {
      rating: { count: 1_200_000, score: 9.3 },
      title: "Test",
    };
    cache.set("tt0111161", value);

    expect(cache.get("tt0111161")).toStrictEqual(value);
  });

  /* ── Custom TTL ─────────────────────────────────── */

  it("uses the provided TTL when storing (t10)", () => {
    // 50ms
    const shortTtl = 50;
    const cache = createCache<string>("dp:ttl-cache", shortTtl);

    cache.set("fast", "gone");

    // Immediately verify it's there
    expect(cache.get("fast")).toBe("gone");

    // Wait for expiry
    const deadline = Date.now() + 200;
    while (Date.now() < deadline) {
      /* spin */
    }

    expect(cache.get("fast")).toBeUndefined();
  });

  /* ── Empty / missing storage ────────────────────── */

  it("handles empty localStorage gracefully (t11)", () => {
    const cache = createCache<string>("dp:empty-cache");
    expect(cache.get("anything")).toBeUndefined();
  });
});
