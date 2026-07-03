/* ── hashStr — Pure Function Tests ────────────────────────── */
/* Tests the deterministic DJB2-like string hash.              */

import { describe, it, expect } from "vitest";

import { hashStr } from "../../src/utils/hash";

describe("hashStr", () => {
  it("returns the same value for the same input (deterministic)", () => {
    expect(hashStr("肖申克的救赎")).toBe(hashStr("肖申克的救赎"));
  });

  it("returns different values for different inputs", () => {
    expect(hashStr("肖申克的救赎")).not.toBe(hashStr("霸王别姬"));
  });

  it("handles empty string", () => {
    expect(hashStr("")).toBe(0);
  });

  it("handles single character", () => {
    // h = (0 * 31 + codePoint) % 1_000_000_007
    // For 'a' (97): 97
    expect(hashStr("a")).toBe(97);
  });

  it("handles short ASCII string", () => {
    // 'ab': h = (97 * 31 + 98) % 1_000_000_007 = 3105
    expect(hashStr("ab")).toBe(3105);
  });

  it("handles Unicode characters (codePointAt path)", () => {
    expect(hashStr("肖")).toBeGreaterThan(0);
    expect(hashStr("😀")).toBeGreaterThan(0);
  });

  it("produces values within modulo range", () => {
    const result = hashStr("a".repeat(1000));
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1_000_000_007);
  });

  it("handles long strings without overflow", () => {
    const result = hashStr(
      "The Shawshank Redemption 肖申克的救赎 1994".repeat(50)
    );
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1_000_000_007);
  });

  it("produces different hashes for similar but different strings", () => {
    expect(hashStr("hello")).not.toBe(hashStr("hEllo"));
  });

  it("hash of digits produces expected results", () => {
    expect(typeof hashStr("1292052")).toBe("number");
    expect(hashStr("1292052")).toBeGreaterThan(0);
  });
});
