/* ── upgradePoster / upgradePhoto — Pure Function Tests ────── */
/* Tests the HD URL upgrade helpers.                            */

import { describe, it, expect } from "vitest";

import {
  upgradePhoto,
  upgradePoster,
} from "@/modules/subject/extract/image-urls";

/* ── upgradePoster ──────────────────────────────────────────── */

describe(upgradePoster, () => {
  const STD =
    "https://img1.doubanio.com/view/photo/s_ratio_poster/public/p480747492.jpg";

  it("replaces /s_ratio_poster/ with /l_ratio_poster/", () => {
    const result = upgradePoster(STD);
    expect(result).toContain("/l_ratio_poster/");
    expect(result).not.toContain("/s_ratio_poster/");
  });

  it("returns the same URL path (encoded) for HD upgrade", () => {
    const result = upgradePoster(STD);
    expect(result).toContain("p480747492");
  });

  it("returns null for null input", () => {
    expect(upgradePoster(null)).toBeNull();
  });

  it("returns null when called without an argument", () => {
    expect(upgradePoster()).toBeNull();
  });

  it("returns null for empty string input", () => {
    expect(upgradePoster("")).toBeNull();
  });

  it("handles URL with s_ratio_poster not in path (legacy)", () => {
    const url = "https://img1.doubanio.com/s_ratio_poster_test.jpg";
    const result = upgradePoster(url);
    expect(result).toContain("l_ratio_poster");
  });

  it("encodes the resulting URL", () => {
    const url =
      "https://img1.doubanio.com/view/photo/s_ratio_poster/public/测试.jpg";
    const result = upgradePoster(url);
    expect(result).toMatch(/^https?:\/\//u);
  });

  it("handles already-upgraded URL idempotently", () => {
    const hd =
      "https://img1.doubanio.com/view/photo/l_ratio_poster/public/p480747492.jpg";
    const result = upgradePoster(hd);
    expect(result).toContain("/l_ratio_poster/");
  });
});

/* ── upgradePhoto ──────────────────────────────────────────── */

describe(upgradePhoto, () => {
  it("replaces /sqxs/ with /large/", () => {
    const url =
      "https://img1.doubanio.com/view/photo/sqxs/public/p480747492.jpg";
    const result = upgradePhoto(url);
    expect(result).toContain("/large/");
    expect(result).not.toContain("/sqxs/");
  });

  it("replaces /m/ with /l/", () => {
    const url = "https://img1.doubanio.com/view/photo/m/public/p480747492.jpg";
    const result = upgradePhoto(url);
    expect(result).toContain("/l/");
    expect(result).not.toContain("/m/");
  });

  it("returns null for null input", () => {
    expect(upgradePhoto(null)).toBeNull();
  });

  it("returns null when called without an argument", () => {
    expect(upgradePhoto()).toBeNull();
  });

  it("returns null for empty string input", () => {
    expect(upgradePhoto("")).toBeNull();
  });

  it("encodes the resulting URL", () => {
    const url = "https://img1.doubanio.com/view/photo/sqxs/public/测试.jpg";
    const result = upgradePhoto(url);
    expect(result).toMatch(/^https?:\/\//u);
  });

  it("handles URL without /sqxs/ or /m/", () => {
    const url =
      "https://img1.doubanio.com/view/photo/large/public/p480747492.jpg";
    const result = upgradePhoto(url);
    expect(result).toBe(encodeURI(url));
  });

  it("handles both replacements when both patterns present", () => {
    const url = "https://img1.doubanio.com/view/photo/sqxs/m/public/p.jpg";
    const result = upgradePhoto(url);
    expect(result).toContain("/large/");
    expect(result).toContain("/l/");
  });
});
