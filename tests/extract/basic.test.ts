/* ── Basic Extractors — Unit Tests ──────────────────────────── */
/* Tests extractTitle, extractYear, extractPoster, extractSubjectId */

import { readFileSync } from "node:fs";

import { describe, it, expect } from "vitest";

import {
  extractTitle,
  extractYear,
  extractPoster,
  extractSubjectId,
} from "@/modules/subject/extract/basic";

import { buildDoc, mockLocation } from "../helpers/doc";

const FIXTURES = `${import.meta.dirname}/../fixtures`;
const MINIMAL = readFileSync(`${FIXTURES}/movie-minimal.html`, "utf-8");
const NO_POSTER = readFileSync(`${FIXTURES}/no-poster.html`, "utf-8");

describe(extractTitle, () => {
  it("extracts full/primary/original title from v:itemreviewed", () => {
    const doc = buildDoc(MINIMAL);
    const result = extractTitle(doc);
    expect(result.full).toBe("肖申克的救赎 / The Shawshank Redemption");
    expect(result.primary).toBe("肖申克的救赎");
    expect(result.original).toBe("/ The Shawshank Redemption");
  });

  it("returns fallback from h1 when v:itemreviewed is missing", () => {
    const html = `<!DOCTYPE html>
<html><body>
  <div id="content">
    <h1>盗梦空间 / Inception <span class="year">(2010)</span></h1>
  </div>
</body></html>`;
    const doc = buildDoc(html);
    const result = extractTitle(doc);
    expect(result.primary).toBe("盗梦空间");
    expect(result.original).toBe("/ Inception");
  });

  it("strips season prefix from original for TV shows (t3)", () => {
    const html = `<!DOCTYPE html>
<html><body>
  <div id="content">
    <h1><span property="v:itemreviewed">权力的游戏 第一季 / Game of Thrones Season 1</span><span class="year">(2011)</span></h1>
  </div>
</body></html>`;
    const doc = buildDoc(html);
    const result = extractTitle(doc);
    expect(result.primary).toBe("权力的游戏");
    expect(result.original).toBe("/ Game of Thrones Season 1");
  });
});

describe(extractYear, () => {
  it("extracts year from .year element", () => {
    const doc = buildDoc(MINIMAL);
    expect(extractYear(doc)).toBe("1994");
  });

  it("returns empty string when no year element", () => {
    const doc = buildDoc(
      "<html><body><div id='content'><h1>Test</h1></div></body></html>"
    );
    expect(extractYear(doc)).toBe("");
  });
});

describe(extractPoster, () => {
  it("extracts poster URL from #mainpic img and upgrades to HD", () => {
    const doc = buildDoc(MINIMAL);
    const result = extractPoster(doc);
    expect(result).not.toBeNull();
    expect(result).toContain("p480747492");
    expect(result).toContain("l_ratio_poster");
  });

  it("returns null when no poster element exists", () => {
    const doc = buildDoc(NO_POSTER);
    expect(extractPoster(doc)).toBeNull();
  });
});

describe(extractSubjectId, () => {
  it("extracts subject ID from doc location pathname", () => {
    const doc = buildDoc(MINIMAL);
    const restore = mockLocation(doc, "/subject/1292052/");
    expect(extractSubjectId(doc)).toBe("1292052");
    restore();
  });

  it("returns empty string when pathname has no subject ID", () => {
    const doc = buildDoc(MINIMAL);
    const restore = mockLocation(doc, "/");
    expect(extractSubjectId(doc)).toBe("");
    restore();
  });

  it("returns empty string when pathname is empty", () => {
    const doc = buildDoc(MINIMAL);
    const restore = mockLocation(doc, "");
    expect(extractSubjectId(doc)).toBe("");
    restore();
  });
});
