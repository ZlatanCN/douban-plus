/* ── Media Extractors — Unit Tests ──────────────────────────── */
/* Tests extractCelebrities, extractPhotos, extractTrailers.     */

import { describe, it, expect } from "vitest";

import {
  extractCelebrities,
  extractPhotos,
  extractTrailers,
} from "../../src/extract";
import { buildDoc } from "../helpers";

describe("extractCelebrities", () => {
  it("extracts cast/crew from #celebrities list", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<ul id="celebrities">
  <li class="celebrity">
    <div class="avatar" style="background-image: url(https://img1.doubanio.com/icon/u1.jpg);"></div>
    <div class="info"><div class="name"><a href="/celebrity/1054534/">蒂姆·罗宾斯</a></div><div class="role">饰 安迪</div></div>
  </li>
  <li class="celebrity">
    <div class="avatar" style="background-image: url(https://img1.doubanio.com/icon/u2.jpg);"></div>
    <div class="info"><div class="name">摩根·弗里曼</div><div class="role">饰 瑞德</div></div>
  </li>
</ul>
</body></html>`);
    const result = extractCelebrities(doc);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("蒂姆·罗宾斯");
    expect(result[0].role).toBe("饰 安迪");
    expect(result[0].link).toContain("/celebrity/1054534/");
    expect(result[0].avatar).toContain("u1.jpg");
    expect(result[1].name).toBe("摩根·弗里曼");
  });

  it("filters out items with empty name", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<ul id="celebrities">
  <li class="celebrity">
    <div class="avatar"></div>
    <div class="info"><div class="name"></div></div>
  </li>
</ul>
</body></html>`);
    expect(extractCelebrities(doc)).toHaveLength(0);
  });

  it("returns empty array when no celebrities section", () => {
    const doc = buildDoc("<html><body><p>No celebs</p></body></html>");
    expect(extractCelebrities(doc)).toEqual([]);
  });
});

describe("extractPhotos", () => {
  it("extracts photos from #related-pic section", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="related-pic">
  <div class="related-pic-bd">
    <a href="/photo/123/"><img src="https://img1.doubanio.com/view/photo/sqxs/public/p1.jpg"/></a>
    <a href="/photo/456/"><img src="https://img1.doubanio.com/view/photo/sqxs/public/p2.jpg"/></a>
  </div>
</div>
</body></html>`);
    const result = extractPhotos(doc);
    expect(result).toHaveLength(2);
    expect(result[0].thumbUrl).toContain("p1.jpg");
    expect(result[0].hdUrl).toContain("/large/");
    expect(result[0].link).toContain("/photo/123/");
  });

  it("filters out items with empty thumbUrl", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="related-pic">
  <div class="related-pic-bd">
    <img src=""/>
  </div>
</div>
</body></html>`);
    expect(extractPhotos(doc)).toHaveLength(0);
  });
});

describe("extractTrailers", () => {
  it("extracts trailers from #related-pic li.label-trailer", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="related-pic">
  <li class="label-trailer">
    <a class="related-pic-video" href="/trailer/324711/" title="预告片"
       style="background-image: url(https://img1.doubanio.com/img/trailer/thumb.jpg);"></a>
  </li>
</div>
</body></html>`);
    const result = extractTrailers(doc);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("预告片");
    expect(result[0].trailerPageUrl).toContain("/trailer/324711/");
    expect(result[0].thumbUrl).toContain("thumb.jpg");
  });

  it("filters out items with missing trailer link", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="related-pic">
  <li class="label-trailer">
    <!-- no a.related-pic-video → no trailer -->
  </li>
</div>
</body></html>`);
    expect(extractTrailers(doc)).toHaveLength(0);
  });
});
