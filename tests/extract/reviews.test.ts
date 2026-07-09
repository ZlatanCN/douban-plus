/* ── Reviews Extractor — Unit Tests ─────────────────────────── */
/* Tests extractReviews.                                        */

import { describe, it, expect } from "vitest";

import { extractReviews } from "@/extract/reviews";

import { buildDoc } from "../helpers/doc";

describe(extractReviews, () => {
  it("extracts review metadata from #reviews-wrapper", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="main review-item" id="17191063">
    <header class="main-hd">
      <a href="/people/user1/" class="avator"><img src="https://img1.doubanio.com/icon/u12345.jpg"/></a>
      <a href="/people/user1/" class="name">用户1</a>
      <span class="allstar40 main-title-rating" title="推荐"></span>
      <span class="main-meta">2024-03-10</span>
    </header>
    <div class="main-bd">
      <h2><a href="/review/17191063/">很棒的影片</a></h2>
      <div class="review-short" data-rid="17191063">
        <div class="short-content">一部令人深思的经典之作</div>
      </div>
      <div class="action">
        <a href="javascript:;" class="action-btn up" data-rid="17191063" title="有用">12</a>
        <a href="javascript:;" class="action-btn down" data-rid="17191063" title="没用">1</a>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    const result = extractReviews(doc);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("用户1");
    expect(result[0].title).toBe("很棒的影片");
    expect(result[0].stars).toBe(4);
    expect(result[0].time).toBe("2024-03-10");
  });

  it("extracts review vote counts and content from #reviews-wrapper", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="main review-item" id="17191063">
    <header class="main-hd">
      <a href="/people/user1/" class="avator"><img src="https://img1.doubanio.com/icon/u12345.jpg"/></a>
      <a href="/people/user1/" class="name">用户1</a>
      <span class="allstar40 main-title-rating" title="推荐"></span>
      <span class="main-meta">2024-03-10</span>
    </header>
    <div class="main-bd">
      <h2><a href="/review/17191063/">很棒的影片</a></h2>
      <div class="review-short" data-rid="17191063">
        <div class="short-content">一部令人深思的经典之作</div>
      </div>
      <div class="action">
        <a href="javascript:;" class="action-btn up" data-rid="17191063" title="有用">12</a>
        <a href="javascript:;" class="action-btn down" data-rid="17191063" title="没用">1</a>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    const result = extractReviews(doc);
    expect(result[0].usefulCount).toBe(12);
    expect(result[0].uselessCount).toBe(1);
    expect(result[0].content).toBe("一部令人深思的经典之作");
  });

  it("skips items with empty title", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="review-item" id="17191064">
    <div class="main-hd">
      <a href="/people/user1/" class="name">用户1</a>
      <span class="main-meta">2024-03-10</span>
    </div>
    <div class="main-bd">
      <h2><a href="/review/17191064/"></a></h2>
      <div class="review-short">
        <span class="short-content">Some content</span>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    expect(extractReviews(doc)).toHaveLength(0);
  });

  it("skips items with no author name", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="review-item" id="17191065">
    <div class="main-hd">
      <a href="/people/anon/" class="name"></a>
      <span class="main-meta">2024-03-10</span>
    </div>
    <div class="main-bd">
      <h2><a href="/review/17191065/">有标题无作者</a></h2>
      <div class="review-short">
        <span class="short-content">Content here</span>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    expect(extractReviews(doc)).toHaveLength(0);
  });

  it("returns empty array when no reviews section", () => {
    const doc = buildDoc("<html><body><p>No reviews here</p></body></html>");
    expect(extractReviews(doc)).toStrictEqual([]);
  });

  it("detects spoiler", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="review-item" id="17191066">
    <div class="main-hd">
      <a href="/people/user3/" class="name">用户3</a>
      <span class="allstar40 main-title-rating" title="推荐"></span>
      <span class="main-meta">2024-03-11</span>
    </div>
    <div class="main-bd">
      <h2><a href="/review/17191066/">含剧透</a></h2>
      <div class="review-short">
        <span class="short-content"><span class="spoiler-tip">剧透警告</span>剧情大逆转</span>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    const result = extractReviews(doc);
    expect(result).toHaveLength(1);
    expect(result[0].spoiler).toBeTruthy();
  });

  it("handles missing avatar", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="review-item" id="17191067">
    <div class="main-hd">
      <a href="/people/user4/" class="name">用户4</a>
      <span class="allstar40 main-title-rating" title="推荐"></span>
      <span class="main-meta">2024-03-12</span>
    </div>
    <div class="main-bd">
      <h2><a href="/review/17191067/">无头像评论</a></h2>
      <div class="review-short">
        <span class="short-content">No avatar here</span>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    const result = extractReviews(doc);
    expect(result).toHaveLength(1);
    expect(result[0].avatar).toBe("");
  });

  it("handles allstar30 → 3 stars", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="reviews-wrapper">
  <div class="review-item" id="17191068">
    <div class="main-hd">
      <a href="/people/user5/" class="avator"><img src="https://img1.doubanio.com/icon/u5.jpg"/></a>
      <a href="/people/user5/" class="name">用户5</a>
      <span class="allstar30 main-title-rating" title="还行"></span>
      <span class="main-meta">2024-03-13</span>
    </div>
    <div class="main-bd">
      <h2><a href="/review/17191068/">三星评价</a></h2>
      <div class="review-short">
        <span class="short-content">还行吧</span>
      </div>
    </div>
  </div>
</div>
</body></html>`);
    const result = extractReviews(doc);
    expect(result).toHaveLength(1);
    expect(result[0].stars).toBe(3);
  });
});
