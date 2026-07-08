/* ── Rating Extractor — Unit Tests ──────────────────────────── */
/* Tests extractRating and extractSummary.                       */

import { describe, it, expect } from "vitest";

import { extractRating, extractSummary } from "../../src/extract";
import { buildDoc } from "../helpers";

describe(extractRating, () => {
  it("extracts score from strong.rating_num", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <strong class="rating_num">9.7</strong>
  <span property="v:votes">2920000</span>
</body></html>`);
    const result = extractRating(doc);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(9.7);
    expect(result?.count).toBe(2_920_000);
  });

  it("extracts score from v:average when rating_num missing", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <strong property="v:average">8.5</strong>
  <span class="rating_people"><span>1500</span></span>
</body></html>`);
    const result = extractRating(doc);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(8.5);
    expect(result?.count).toBe(1500);
  });

  it("returns null when no score element exists", () => {
    const doc = buildDoc("<html><body><p>No rating</p></body></html>");
    expect(extractRating(doc)).toBeNull();
  });

  it("returns null for zero score", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <strong class="rating_num">0.0</strong>
</body></html>`);
    expect(extractRating(doc)).toBeNull();
  });

  it("handles missing vote count gracefully", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <strong class="rating_num">8.0</strong>
</body></html>`);
    const result = extractRating(doc);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(8);
    expect(result?.count).toBe(0);
  });

  it("parses formatted vote counts with commas", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <strong class="rating_num">9.2</strong>
  <span property="v:votes">2,920,000</span>
</body></html>`);
    const result = extractRating(doc);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(2_920_000);
  });
});

describe(extractSummary, () => {
  it("extracts summary from v:summary span", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <span property="v:summary">    一场谋杀案
使银行家蒙冤入狱  </span>
</body></html>`);
    const result = extractSummary(doc);
    expect(result).not.toBeNull();
    expect(result).toContain("一场谋杀案");
    expect(result).toContain("入狱");
  });

  it("returns null when no summary element exists", () => {
    const doc = buildDoc("<html><body><p>No summary</p></body></html>");
    expect(extractSummary(doc)).toBeNull();
  });

  it("normalizes whitespace and multiple newlines", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <span property="v:summary">

    段落一。


    段落二。

  </span>
</body></html>`);
    const result = extractSummary(doc);
    expect(result).not.toBeNull();
    expect(result).toContain("段落一");
    expect(result).toContain("段落二");
  });

  it("keeps summary line breaks without paragraph indentation or blank lines", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <span property="v:summary">承接上集于纽约大陆酒店中枪坠楼。
 　　为了找出一条真正出路、打破宿命。


   第三段前面也可能有普通空格。</span>
</body></html>`);
    const result = extractSummary(doc);
    expect(result).toBe(
      "承接上集于纽约大陆酒店中枪坠楼。\n为了找出一条真正出路、打破宿命。\n第三段前面也可能有普通空格。"
    );
  });

  it("returns null for empty summary", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <span property="v:summary"></span>
</body></html>`);
    expect(extractSummary(doc)).toBeNull();
  });
});
