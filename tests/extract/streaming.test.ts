/* ── Streaming Extractor — Unit Tests ────────────────────────── */
/* Tests extractStreaming and parsePlaySources.                   */

import { describe, it, expect } from "vitest";

import { extractStreaming, parsePlaySources } from "../../src/extract";
import { buildDoc } from "../helpers";

describe("parsePlaySources", () => {
  it("extracts play sources from inline script", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<script>
var sources = [];
sources[0] = [{play_link: "https://www.iqiyi.com/play/1"}];
sources[1] = [{play_link: "https://www.youku.com/play/1"}];
</script>
</body></html>`);
    const result = parsePlaySources(doc);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["0"]).toBe("https://www.iqiyi.com/play/1");
    expect(result["1"]).toBe("https://www.youku.com/play/1");
  });

  it("returns empty object when no sources script exists", () => {
    const doc = buildDoc("<html><body><p>No script</p></body></html>");
    expect(parsePlaySources(doc)).toEqual({});
  });
});

describe("extractStreaming", () => {
  it("extracts streaming sources from a.playBtn elements", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="playBtn" href="https://www.iqiyi.com/" data-cn="爱奇艺">爱奇艺</a>
<a class="playBtn" href="https://www.youku.com/" data-cn="优酷">优酷</a>
</body></html>`);
    const result = extractStreaming(doc);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("爱奇艺");
    expect(result[0].href).toBe("https://www.iqiyi.com/");
    expect(result[1].name).toBe("优酷");
  });

  it("deduplicates sources by name", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="playBtn" href="https://www.iqiyi.com/" data-cn="爱奇艺">爱奇艺</a>
<a class="playBtn" href="https://www.iqiyi.com/other" data-cn="爱奇艺">爱奇艺</a>
</body></html>`);
    const result = extractStreaming(doc);
    expect(result).toHaveLength(1);
  });

  it("falls back to online-video links for non-playBtn sources", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a href="https://www.example.com/online-video/play" data-cn="其他平台">其他平台</a>
</body></html>`);
    const result = extractStreaming(doc);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("其他平台");
  });

  it("skips playBtn with non-http href and no source mapping", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="playBtn" href="javascript:void(0)" data-cn="无效">无效</a>
</body></html>`);
    const result = extractStreaming(doc);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when no streaming sources", () => {
    const doc = buildDoc("<html><body><p>No streams</p></body></html>");
    expect(extractStreaming(doc)).toEqual([]);
  });
});
