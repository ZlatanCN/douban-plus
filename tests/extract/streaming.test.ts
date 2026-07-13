/* ── Streaming Extractor — Unit Tests ────────────────────────── */
/* Tests observable Streaming[] results from the Douban document. */

import { describe, it, expect } from "vitest";

import { extractStreaming } from "@/extract/streaming";

import { buildDoc } from "../helpers/doc";

describe(extractStreaming, () => {
  it("combines the three Douban streaming adapters into one result", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="playBtn" href="https://www.iqiyi.com/play/1" data-cn="爱奇艺" data-pic="https://img.example.com/iqiyi.png">爱奇艺</a>
<a href="https://www.example.com/online-video/play" data-cn="其他平台">其他平台</a>
<a class="playBtn" href="javascript:void(0)" data-cn="优酷" data-source="1">优酷</a>
<script>
var sources = [];
sources[1] = [{play_link: "https://www.youku.com/play/1?from=tv&amp;episode=1"}];
</script>
</body></html>`);

    expect(extractStreaming(doc)).toStrictEqual([
      {
        href: "https://www.iqiyi.com/play/1",
        iconUrl: "https://img.example.com/iqiyi.png",
        name: "爱奇艺",
      },
      {
        href: "https://www.youku.com/play/1?from=tv&episode=1",
        iconUrl: undefined,
        name: "优酷",
      },
      { href: "https://www.example.com/online-video/play", name: "其他平台" },
    ]);
  });

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

  it("skips non-http legacy source mappings", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="playBtn" href="javascript:void(0)" data-cn="无效" data-source="1">无效</a>
<script>
var sources = [];
sources[1] = [{play_link: "javascript:alert('unsafe')"}];
</script>
</body></html>`);

    expect(extractStreaming(doc)).toStrictEqual([]);
  });

  it("uses a later adapter when an earlier source has no valid URL", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
<a class="playBtn" href="javascript:void(0)" data-cn="爱奇艺">爱奇艺</a>
<a href="https://www.iqiyi.com/online-video/play" data-cn="爱奇艺">爱奇艺</a>
</body></html>`);

    expect(extractStreaming(doc)).toStrictEqual([
      { href: "https://www.iqiyi.com/online-video/play", name: "爱奇艺" },
    ]);
  });

  it("returns empty array when no streaming sources", () => {
    const doc = buildDoc("<html><body><p>No streams</p></body></html>");
    expect(extractStreaming(doc)).toStrictEqual([]);
  });
});
