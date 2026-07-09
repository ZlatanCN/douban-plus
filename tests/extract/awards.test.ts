/* ── Awards Extractor — Unit Tests ──────────────────────────── */
/* Tests extractAwards from ul.award elements.                   */

import { describe, it, expect } from "vitest";

import { extractAwards } from "@/extract/awards";

import { buildDoc } from "../helpers/doc";

describe(extractAwards, () => {
  it("extracts awards from ul.award elements", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<ul class="award">
  <li><a href="/award/1/">奥斯卡金像奖</a></li>
  <li>最佳影片(提名)</li>
  <li><a href="/celebrity/1000868/">斯蒂芬·金</a></li>
</ul>
<ul class="award">
  <li>金球奖</li>
  <li>最佳男主角(提名)</li>
  <li></li>
</ul>
</body></html>`);
    const result = extractAwards(doc);
    expect(result).toHaveLength(2);

    expect(result[0].org).toBe("奥斯卡金像奖");
    expect(result[0].orgLink).toContain("/award/1/");
    expect(result[0].name).toBe("最佳影片(提名)");
    expect(result[0].person).toBe("斯蒂芬·金");
  });

  it("extracts award person link", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<ul class="award">
  <li><a href="/award/1/">奥斯卡金像奖</a></li>
  <li>最佳影片(提名)</li>
  <li><a href="/celebrity/1000868/">斯蒂芬·金</a></li>
</ul>
<ul class="award">
  <li>金球奖</li>
  <li>最佳男主角(提名)</li>
  <li></li>
</ul>
</body></html>`);
    const result = extractAwards(doc);
    expect(result[0].personLink).toContain("/celebrity/1000868/");
  });

  it("extracts award with missing optional fields", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<ul class="award">
  <li><a href="/award/1/">奥斯卡金像奖</a></li>
  <li>最佳影片(提名)</li>
  <li><a href="/celebrity/1000868/">斯蒂芬·金</a></li>
</ul>
<ul class="award">
  <li>金球奖</li>
  <li>最佳男主角(提名)</li>
  <li></li>
</ul>
</body></html>`);
    const result = extractAwards(doc);

    expect(result[1].org).toBe("金球奖");
    expect(result[1].orgLink).toBe("");
    expect(result[1].person).toBe("");
  });

  it("filters out items with empty org", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<ul class="award">
  <li></li>
  <li></li>
  <li></li>
</ul>
</body></html>`);
    expect(extractAwards(doc)).toHaveLength(0);
  });

  it("returns empty array when no award elements", () => {
    const doc = buildDoc("<html><body><p>No awards</p></body></html>");
    expect(extractAwards(doc)).toStrictEqual([]);
  });
});
