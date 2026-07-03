/* ── Social Extractors — Unit Tests ──────────────────────────── */
/* Tests extractComments and extractRecommendations.              */

import { describe, it, expect } from "vitest";

import { extractComments, extractRecommendations } from "../../src/extract";
import { buildDoc } from "../helpers";

describe("extractRecommendations", () => {
  it("extracts related movie recommendations from .recommendations-bd", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div class="recommendations-bd">
  <dl>
    <dt><a href="/subject/1291546/"><img src="https://img1.doubanio.com/view/photo/s_ratio_poster/public/p6982253.jpg"/></a></dt>
    <dd><a href="/subject/1291546/">霸王别姬</a></dd>
  </dl>
  <dl>
    <dt><a href="/subject/1292722/"><img src="https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2192307.jpg"/></a></dt>
    <dd><a href="/subject/1292722/">阿甘正传</a></dd>
  </dl>
</div>
</body></html>`);
    const result = extractRecommendations(doc);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("霸王别姬");
    expect(result[0].link).toContain("/subject/1291546/");
    expect(result[1].title).toBe("阿甘正传");
  });

  it("filters out items with empty title", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div class="recommendations-bd">
  <dl>
    <dt><a href="/subject/1/"><img src="https://img1.doubanio.com/1.jpg"/></a></dt>
    <dd><a href="/subject/1/"></a></dd>
  </dl>
</div>
</body></html>`);
    expect(extractRecommendations(doc)).toHaveLength(0);
  });

  it("returns empty array when no recommendations section", () => {
    const doc = buildDoc("<html><body><p>No recs</p></body></html>");
    expect(extractRecommendations(doc)).toEqual([]);
  });
});

describe("extractComments", () => {
  it("extracts user comments from #hot-comments", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="hot-comments">
  <div class="comment-item" data-cid="1001">
    <div class="avatar"><a href="/people/user1/"><img src="https://img1.doubanio.com/icon/u1.jpg"/></a></div>
    <div class="comment-info"><a href="/people/user1/">用户1</a></div>
    <div class="comment-content">
      <span class="allstar50"></span>
      <span class="comment-time" title="2024-01-15">2024-01-15</span>
    </div>
    <span class="short">经典之作</span>
    <span class="vote-count">128</span>
  </div>
</div>
</body></html>`);
    const result = extractComments(doc);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("用户1");
    expect(result[0].content).toBe("经典之作");
    expect(result[0].stars).toBe(5);
    expect(result[0].votes).toBe(128);
    expect(result[0].cid).toBe("1001");
  });

  it("filters out items with no name or content", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="hot-comments">
  <div class="comment-item" data-cid="1002">
    <span class="short"></span>
  </div>
</div>
</body></html>`);
    expect(extractComments(doc)).toHaveLength(0);
  });

  it("skips items with empty author name", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="hot-comments">
  <div class="comment-item" data-cid="1003">
    <a class="comment-info" href="/people/anon/"></a>
    <span class="short">No author name</span>
  </div>
</div>
</body></html>`);
    expect(extractComments(doc)).toHaveLength(0);
  });

  it("returns empty array when no comments section", () => {
    const doc = buildDoc("<html><body><p>No comments</p></body></html>");
    expect(extractComments(doc)).toEqual([]);
  });

  it("detects voted state when .j.vote-comment is missing", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="hot-comments">
  <div class="comment-item" data-cid="1004">
    <div class="comment-info"><a href="/people/u/">用户A</a></div>
    <span class="short">已投票</span>
    <!-- no .j.vote-comment → voted=true -->
  </div>
</div>
</body></html>`);
    const result = extractComments(doc);
    expect(result).toHaveLength(1);
    expect(result[0].voted).toBe(true);
  });
});
