import { describe, expect, it } from "vitest";

import { extractDiscussions } from "@/extract/discussions";

import { buildDoc } from "../helpers/doc";

describe(extractDiscussions, () => {
  it("extracts valid topics in source order and normalizes their links", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html>
  <head><base href="https://movie.douban.com/subject/3016187/"></head>
  <body>
    <div class="section-discussion">
      <table class="olt"><tbody>
        <tr><td></td><td></td><td></td><td></td></tr>
        <tr>
          <td class="pl"><a href="https://www.douban.com/group/topic/480926084/?sig=a%20b&amp;_spm_id=tracking&amp;from=subject">才开始追！乔佛里好恶心啊</a></td>
        </tr>
        <tr><td class="pl"><a href="/group/topic/291952805/?keep=1">看到斯塔克被砍头只想说：好似</a></td></tr>
        <tr><td class="pl"><a href="//www.douban.com/group/topic/491769565/">王后一家纯蠢人</a></td></tr>
        <tr><td class="pl"><a href="javascript:alert(1)">不安全链接</a></td></tr>
        <tr><td class="pl"><a href="https://evil.example/group/topic/99/">站外伪话题</a></td></tr>
        <tr><td class="pl"><a href="https://www.douban.com/people/user/">非话题链接</a></td></tr>
        <tr><td class="pl"><a href="/group/topic/empty/"></a></td></tr>
      </tbody></table>
    </div>
  </body>
</html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      topics: [
        {
          href: "https://www.douban.com/group/topic/480926084/?sig=a%20b&from=subject",
          title: "才开始追！乔佛里好恶心啊",
        },
        {
          href: "https://www.douban.com/group/topic/291952805/?keep=1",
          title: "看到斯塔克被砍头只想说：好似",
        },
        {
          href: "https://www.douban.com/group/topic/491769565/",
          title: "王后一家纯蠢人",
        },
      ],
    });
  });

  it("limits the native topic summary to the first ten valid topics", () => {
    const rows = Array.from(
      { length: 12 },
      (_, index) =>
        `<tr><td><a href="https://www.douban.com/group/topic/${index + 1}/">话题 ${index + 1}</a></td></tr>`
    ).join("");
    const doc = buildDoc(`<!DOCTYPE html>
<html>
  <body>
    <div class="section-discussion"><table class="olt"><tbody>${rows}</tbody></table></div>
  </body>
</html>`);

    expect(
      extractDiscussions(doc).topics.map((topic) => topic.title)
    ).toStrictEqual([
      "话题 1",
      "话题 2",
      "话题 3",
      "话题 4",
      "话题 5",
      "话题 6",
      "话题 7",
      "话题 8",
      "话题 9",
      "话题 10",
    ]);
  });

  it("extracts author identity, zero replies, and a timestamp from a valid topic row", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion"><table class="olt"><tbody>
    <tr>
      <td><a href="/group/topic/480926084/">讨论主题</a></td>
      <td><span>来自</span><a href="/people/127190935/">🍈</a></td>
      <td><span></span></td>
      <td><span>2026-07-09 16:31:45</span></td>
    </tr>
  </tbody></table></div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      topics: [
        {
          activity: {
            date: "2026-07-09",
            dateTime: "2026-07-09T16:31:45",
            raw: "2026-07-09 16:31:45",
            time: "16:31",
          },
          author: {
            href: "https://www.douban.com/people/127190935/",
            name: "🍈",
          },
          href: "https://www.douban.com/group/topic/480926084/",
          replies: 0,
          title: "讨论主题",
        },
      ],
    });
  });

  it("extracts native discussion entry points without rewriting their parameters", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion">
    <div class="hd-ops"><a class="comment_btn" href="//www.douban.com/group/653616?from=subject&amp;_spm_id=keep">发起新的讨论</a></div>
    <table class="olt"><tbody>
      <tr><td><a href="/group/topic/480926084/">讨论主题</a></td></tr>
    </tbody></table>
    <p><a href="/group/653616#topics">去这部剧集的小组讨论（全部15166条）</a></p>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      allDiscussions: {
        href: "https://www.douban.com/group/653616#topics",
        total: 15_166,
      },
      startDiscussionHref:
        "https://www.douban.com/group/653616?from=subject&_spm_id=keep",
      topics: [
        {
          href: "https://www.douban.com/group/topic/480926084/",
          title: "讨论主题",
        },
      ],
    });
  });

  it("keeps valid topics when optional discussion metadata cannot be resolved", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion"><table class="olt"><tbody>
    <tr>
      <td><a href="/group/topic/1/">只有纯文本作者</a></td>
      <td><span>来自</span><span>匿名</span></td>
      <td><span>很多回应</span></td>
      <td><span>昨天</span></td>
    </tr>
    <tr>
      <td><a href="/group/topic/2/">没有可用元信息</a></td>
      <td><span>来自</span></td>
    </tr>
  </tbody></table>
  <p align="right"><a href="/group/653616#topics">全部未知条</a></p>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      allDiscussions: {
        href: "https://www.douban.com/group/653616#topics",
      },
      topics: [
        {
          activity: { raw: "昨天" },
          author: { name: "匿名" },
          href: "https://www.douban.com/group/topic/1/",
          title: "只有纯文本作者",
        },
        {
          href: "https://www.douban.com/group/topic/2/",
          title: "没有可用元信息",
        },
      ],
    });
  });

  it("rejects unsafe collection action URLs without dropping valid topics", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion">
    <div class="hd-ops"><a class="comment_btn" href="javascript:alert(1)">发起新的讨论</a></div>
    <table class="olt"><tbody>
      <tr>
        <td><a href="/group/topic/1/">讨论主题</a></td>
        <td><span>来自</span><a href="/link2/?url=https%3A%2F%2Fevil.example">恶意作者</a></td>
      </tr>
    </tbody></table>
    <p align="right"><a href="https://evil.example/group/653616">查看全部</a></p>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      topics: [
        {
          author: { name: "恶意作者" },
          href: "https://www.douban.com/group/topic/1/",
          title: "讨论主题",
        },
      ],
    });
  });

  it("treats malformed discussion totals as unknown", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion">
    <table class="olt"><tbody>
      <tr><td><a href="/group/topic/1/">讨论主题</a></td></tr>
    </tbody></table>
    <p align="right"><a href="/group/653616#topics">全部1,,2条</a></p>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      allDiscussions: {
        href: "https://www.douban.com/group/653616#topics",
      },
      topics: [
        {
          href: "https://www.douban.com/group/topic/1/",
          title: "讨论主题",
        },
      ],
    });
  });

  it("keeps an impossible timestamp as raw activity text", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion"><table class="olt"><tbody>
    <tr>
      <td><a href="/group/topic/1/">讨论主题</a></td>
      <td></td><td></td><td>2026-02-30 16:31:45</td>
    </tr>
  </tbody></table></div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      topics: [
        {
          activity: { raw: "2026-02-30 16:31:45" },
          href: "https://www.douban.com/group/topic/1/",
          replies: 0,
          title: "讨论主题",
        },
      ],
    });
  });

  it("normalizes whitespace in a valid native timestamp for its semantic datetime", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion"><table class="olt"><tbody>
    <tr>
      <td><a href="/group/topic/1/">讨论主题</a></td>
      <td></td><td></td><td>2026-07-09  16:31:45</td>
    </tr>
  </tbody></table></div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      topics: [
        {
          activity: {
            date: "2026-07-09",
            dateTime: "2026-07-09T16:31:45",
            raw: "2026-07-09  16:31:45",
            time: "16:31",
          },
          href: "https://www.douban.com/group/topic/1/",
          replies: 0,
          title: "讨论主题",
        },
      ],
    });
  });

  it("returns an empty topic collection when the native section is absent", () => {
    const doc = buildDoc("<!DOCTYPE html><html><body></body></html>");

    expect(extractDiscussions(doc)).toStrictEqual({ topics: [] });
  });
});
