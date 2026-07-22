/* ── extractSeries — Unit Tests ──────────────────────────── */

import { describe, it, expect } from "vitest";

import { extractSeries } from "@/modules/subject/extract/series";

import { buildDoc } from "../helpers/doc";

describe(extractSeries, () => {
  it("extracts first series item from #series-items section", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="series-items">
<div class="items-swiper">
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg" alt="第一季"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a><span class="items-swiper-item-rating">9.5</span></div>
</div>
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/2/"><img src="https://img1.doubanio.com/poster2.jpg" alt="第二季"></a></div>
  <div class="items-swiper-item-title" title="第二季"><a href="https://movie.douban.com/subject/2/">第二季</a><span class="items-swiper-item-rating">9.3</span></div>
</div>
</div>
</div>
</body></html>`);
    const result = extractSeries(doc);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("第一季");
    expect(result[0].rating).toBe("9.5");
    expect(result[0].link).toContain("/subject/1/");
  });

  it("extracts first series item poster", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="series-items">
<div class="items-swiper">
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg" alt="第一季"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a><span class="items-swiper-item-rating">9.5</span></div>
</div>
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/2/"><img src="https://img1.doubanio.com/poster2.jpg" alt="第二季"></a></div>
  <div class="items-swiper-item-title" title="第二季"><a href="https://movie.douban.com/subject/2/">第二季</a><span class="items-swiper-item-rating">9.3</span></div>
</div>
</div>
</div>
</body></html>`);
    const result = extractSeries(doc);
    expect(result[0].poster).toContain("poster1.jpg");
  });

  it("extracts second series item", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="series-items">
<div class="items-swiper">
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg" alt="第一季"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a><span class="items-swiper-item-rating">9.5</span></div>
</div>
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/2/"><img src="https://img1.doubanio.com/poster2.jpg" alt="第二季"></a></div>
  <div class="items-swiper-item-title" title="第二季"><a href="https://movie.douban.com/subject/2/">第二季</a><span class="items-swiper-item-rating">9.3</span></div>
</div>
</div>
</div>
</body></html>`);
    const result = extractSeries(doc);
    expect(result[1].title).toBe("第二季");
    expect(result[1].rating).toBe("9.3");
  });

  it("deduplicates swiper-slide-duplicate items by link", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="series-items">
<div class="items-swiper">
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg" alt="第一季"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a><span class="items-swiper-item-rating">9.5</span></div>
</div>
<div class="items-swiper-item swiper-slide-duplicate">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg" alt="第一季"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a><span class="items-swiper-item-rating">9.5</span></div>
</div>
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/2/"><img src="https://img1.doubanio.com/poster2.jpg" alt="第二季"></a></div>
  <div class="items-swiper-item-title" title="第二季"><a href="https://movie.douban.com/subject/2/">第二季</a><span class="items-swiper-item-rating">9.3</span></div>
</div>
</div>
</div>
</body></html>`);
    const result = extractSeries(doc);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no #series-items section", () => {
    const doc = buildDoc("<html><body></body></html>");
    expect(extractSeries(doc)).toStrictEqual([]);
  });

  it("handles items without poster image", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="series-items">
<div class="items-swiper">
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a></div>
</div>
</div>
</div>
</body></html>`);
    const result = extractSeries(doc);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result[0].poster).toBe("");
  });

  it("handles items without rating", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="series-items">
<div class="items-swiper">
<div class="items-swiper-item">
  <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg" alt="第一季"></a></div>
  <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a></div>
</div>
</div>
</div>
</body></html>`);
    const result = extractSeries(doc);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result[0].rating).toBe("");
  });
});
