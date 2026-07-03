/* ── Info Extractor — Unit Tests ──────────────────────────────── */
/* Tests extractInfo — directors, writers, cast, genres, etc.      */

import { describe, it, expect } from "vitest";

import { extractInfo } from "../../src/extract";
import { buildDoc } from "../helpers";

describe("extractInfo", () => {
  it("extracts movie info from #info block", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="info">
  <span class="pl">导演:</span> <a href="/celebrity/1047973/">弗兰克·德拉邦特</a><br/>
  <span class="pl">编剧:</span> <a href="/celebrity/1013799/">弗兰克·德拉邦特</a> / <a href="/celebrity/1000868/">斯蒂芬·金</a><br/>
  <span class="pl">主演:</span> <a href="/celebrity/1054534/">蒂姆·罗宾斯</a> / <a href="/celebrity/1054446/">摩根·弗里曼</a><br/>
  <span class="pl">类型:</span> <span property="v:genre">剧情</span> / <span property="v:genre">犯罪</span><br/>
  <span class="pl">制片国家/地区:</span> 美国<br/>
  <span class="pl">语言:</span> 英语<br/>
  <span class="pl">片长:</span> <span property="v:runtime">142</span>分钟<br/>
  <span class="pl">又名:</span> 月黑高飞(香港) / 刺激1995(台湾)<br/>
  <span class="pl">IMDb:</span> <a href="https://www.imdb.com/title/tt0111161/">tt0111161</a><br/>
</div>
</body></html>`);
    const result = extractInfo(doc);

    expect(result.director).toHaveLength(1);
    expect(result.director[0].text).toBe("弗兰克·德拉邦特");

    expect(result.writers).toHaveLength(2);
    expect(result.writers[1].text).toBe("斯蒂芬·金");

    expect(result.cast).toHaveLength(2);
    expect(result.cast[0].text).toBe("蒂姆·罗宾斯");

    expect(result.genres).toEqual(["剧情", "犯罪"]);
    expect(result.country).toBe("美国");
    expect(result.language).toBe("英语");

    expect(result.runtime).toContain("142");
    expect(result.aliases).toContain("月黑高飞");
    expect(result.imdb).toBe("tt0111161");
  });

  it("extracts TV info with seasons and episodes", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<div id="info">
  <span class="pl">导演:</span> <a href="/celebrity/1000868/">蒂莫西·范·帕腾</a><br/>
  <span class="pl">主演:</span> <a href="/celebrity/1000871/">肖恩·宾</a><br/>
  <span class="pl">类型:</span> <span property="v:genre">剧情</span> / <span property="v:genre">奇幻</span><br/>
  <span class="pl">制片国家/地区:</span> 美国<br/>
  <span class="pl">语言:</span> 英语<br/>
  <span class="pl">首播:</span> 2011-04-17<br/>
  <span class="pl">季数:</span> <select id="season"><option selected value="1">1</option></select><br/>
  <span class="pl">集数:</span> 10<br/>
  <span class="pl">单集片长:</span> 60分钟<br/>
</div>
</body></html>`);
    const result = extractInfo(doc);

    expect(result.firstAired).toBe("2011-04-17");
    expect(result.seasons).toBe("1");
    expect(result.episodes).toBe("10");
    expect(result.episodeRuntime).toBe("60分钟");
  });

  it("returns default values when no #info block exists", () => {
    const doc = buildDoc("<html><body><p>No info</p></body></html>");
    const result = extractInfo(doc);
    expect(result.director).toEqual([]);
    expect(result.genres).toEqual([]);
    expect(result.country).toBe("");
    expect(result.imdb).toBe("");
  });
});
