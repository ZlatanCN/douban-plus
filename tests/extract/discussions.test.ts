import { describe, expect, it } from "vitest";

import { extractDiscussions } from "@/modules/subject/extract/discussions";

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

  /* ── 讨论区 Type 2: .section-discussion with <h2>讨论区</h2> ─── */

  it("extracts topics from 讨论区 Type 2 (.section-discussion, 讨论区 heading)", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion">
    <div class="mod-hd">
      <a class="comment_btn" href="/subject/1866479/discussion/create"><span>添加新讨论</span></a>
      <h2>讨论区 · · · · · ·</h2>
    </div>
    <table class="olt"><tbody>
      <tr>
        <td class="pl"><a href="/subject/1866479/discussion/637822546/">《复仇者联盟》故事详情</a></td>
        <td class="pl"><span>来自</span><a href="/people/2081423/">Jack</a></td>
        <td class="pl"><span></span></td>
        <td class="pl"><span>2025-12-23 13:44:29</span></td>
      </tr>
      <tr>
        <td class="pl"><a href="/subject/1866479/discussion/637943690/">发现了和魔戒的联动！</a></td>
        <td class="pl"><span>来自</span><a href="/people/141050347/">阿彩</a></td>
        <td class="pl"><span></span></td>
        <td class="pl"><span>2025-12-12 20:33:08</span></td>
      </tr>
    </tbody></table>
    <p class="pl" align="right">
      <a href="/subject/1866479/discussion/">去这部影片的讨论区（全部381条）</a>
    </p>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      allDiscussions: {
        href: "https://www.douban.com/subject/1866479/discussion/",
        total: 381,
      },
      startDiscussionHref:
        "https://www.douban.com/subject/1866479/discussion/create",
      topics: [
        {
          activity: {
            date: "2025-12-23",
            dateTime: "2025-12-23T13:44:29",
            raw: "2025-12-23 13:44:29",
            time: "13:44",
          },
          author: {
            href: "https://www.douban.com/people/2081423/",
            name: "Jack",
          },
          href: "https://www.douban.com/subject/1866479/discussion/637822546/",
          replies: 0,
          title: "《复仇者联盟》故事详情",
        },
        {
          activity: {
            date: "2025-12-12",
            dateTime: "2025-12-12T20:33:08",
            raw: "2025-12-12 20:33:08",
            time: "20:33",
          },
          author: {
            href: "https://www.douban.com/people/141050347/",
            name: "阿彩",
          },
          href: "https://www.douban.com/subject/1866479/discussion/637943690/",
          replies: 0,
          title: "发现了和魔戒的联动！",
        },
      ],
    });
  });

  it("normalizes discussion-area topic and collection URLs when the page has no base URL", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion">
    <table class="olt"><tbody>
      <tr>
        <td><a href="https://www.douban.com/subject/1866479/discussion/637822546/?_spm_id=tracking">故事详情</a></td>
        <td></td><td></td><td></td>
      </tr>
    </tbody></table>
    <p><a href="//www.douban.com/subject/1866479/discussion/">全部381条</a></p>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      allDiscussions: {
        href: "https://www.douban.com/subject/1866479/discussion/",
        total: 381,
      },
      topics: [
        {
          href: "https://www.douban.com/subject/1866479/discussion/637822546/",
          replies: 0,
          title: "故事详情",
        },
      ],
    });
  });

  /* ── 讨论区 Type 1: <div class="mod"> with .mv-discussion-list ─── */

  it("extracts topics from 讨论区 Type 1 (div.mod with mv-discussion-list)", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="mod">
    <div class="hd-ops">
      <a class="comment_btn" href="https://www.douban.com/subject/2149047/discussion/create" rel="nofollow"><span>发起新的讨论</span></a>
    </div>
    <h2>
      <i>讨论区</i> · · · · · ·
      <span class="pl">(<a href="https://www.douban.com/subject/2149047/discussion/">全部</a>)</span>
    </h2>
    <div class="bd">
      <div class="mv-discussion-nav">
        <a href="/subject/2149047/discussion/" class="on">最新</a>
        <a href="/subject/2149047/discussion/?sort=vote">热门</a>
        <a href="/subject/2149047/discussion/?ep_num=1" data-epid="26158">1集</a>
      </div>
      <div class="mv-discussion-list discussion-list">
        <table>
          <thead>
            <tr><td>讨论</td><td>作者</td><td>回应</td><td>最后回应</td></tr>
          </thead>
          <tbody>
            <tr>
              <td class="title"><a href="/subject/2149047/discussion/637915615/" title="Joan她们在茶水间讨论的那本禁书是什么？">[第3集] Joan她们在茶水间讨论的那本禁书是什么？</a></td>
              <td><a href="https://www.douban.com/people/1374868/">约翰泥石流</a></td>
              <td class="reply-num">3</td>
              <td class="time">2026-07-03 11:54</td>
            </tr>
            <tr>
              <td class="title"><a href="/subject/2149047/discussion/615333789/" title="有没有人觉得Don和马男波杰克很像">有没有人觉得Don和马男波杰克很像</a></td>
              <td><a href="https://www.douban.com/people/138847848/">吉尔伽美什</a></td>
              <td class="reply-num">8</td>
              <td class="time">2026-06-20 12:20</td>
            </tr>
            <tr>
              <td class="title"><a href="/subject/2149047/discussion/638003853/" title="萨瓦尔多是gay吗">萨瓦尔多是gay吗</a></td>
              <td><a href="https://www.douban.com/people/272481202/">咸的正好</a></td>
              <td class="reply-num">1</td>
              <td class="time">2026-06-12 14:55</td>
            </tr>
          </tbody>
        </table>
        <a href="https://www.douban.com/subject/2149047/discussion/">&gt; 全部讨论220条</a>
      </div>
      <div class="mv-hot-discussion-list hide">
        <table><tbody>
          <tr><td class="title"><a href="/subject/2149047/discussion/1327961/">Don Draper 是个伪君子</a></td></tr>
        </tbody></table>
      </div>
    </div>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      allDiscussions: {
        href: "https://www.douban.com/subject/2149047/discussion/",
      },
      startDiscussionHref:
        "https://www.douban.com/subject/2149047/discussion/create",
      topics: [
        {
          activity: {
            date: "2026-07-03",
            dateTime: "2026-07-03T11:54",
            raw: "2026-07-03 11:54",
            time: "11:54",
          },
          author: {
            href: "https://www.douban.com/people/1374868/",
            name: "约翰泥石流",
          },
          href: "https://www.douban.com/subject/2149047/discussion/637915615/",
          replies: 3,
          title: "[第3集] Joan她们在茶水间讨论的那本禁书是什么？",
        },
        {
          activity: {
            date: "2026-06-20",
            dateTime: "2026-06-20T12:20",
            raw: "2026-06-20 12:20",
            time: "12:20",
          },
          author: {
            href: "https://www.douban.com/people/138847848/",
            name: "吉尔伽美什",
          },
          href: "https://www.douban.com/subject/2149047/discussion/615333789/",
          replies: 8,
          title: "有没有人觉得Don和马男波杰克很像",
        },
        {
          activity: {
            date: "2026-06-12",
            dateTime: "2026-06-12T14:55",
            raw: "2026-06-12 14:55",
            time: "14:55",
          },
          author: {
            href: "https://www.douban.com/people/272481202/",
            name: "咸的正好",
          },
          href: "https://www.douban.com/subject/2149047/discussion/638003853/",
          replies: 1,
          title: "萨瓦尔多是gay吗",
        },
      ],
    });
  });

  it("does not extract hidden hot-discussion table and handles bare reply numbers", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="mod">
    <div class="mv-discussion-list discussion-list">
      <table><tbody>
        <tr>
          <td class="title"><a href="/subject/2149047/discussion/637915615/">话题</a></td>
          <td><a href="/people/1/">作者</a></td>
          <td class="reply-num"></td>
          <td class="time">2026-07-03 11:54</td>
        </tr>
      </tbody></table>
    </div>
  </div>
</body></html>`);

    expect(extractDiscussions(doc)).toStrictEqual({
      topics: [
        {
          activity: {
            date: "2026-07-03",
            dateTime: "2026-07-03T11:54",
            raw: "2026-07-03 11:54",
            time: "11:54",
          },
          author: {
            href: "https://www.douban.com/people/1/",
            name: "作者",
          },
          href: "https://www.douban.com/subject/2149047/discussion/637915615/",
          replies: 0,
          title: "话题",
        },
      ],
    });
  });

  it("prefers .section-discussion over .mod when both containers exist", () => {
    const doc = buildDoc(`<!DOCTYPE html>
<html><body>
  <div class="section-discussion">
    <table class="olt"><tbody>
      <tr><td><a href="/group/topic/1/">小组话题</a></td></tr>
    </tbody></table>
  </div>
  <div class="mod">
    <div class="mv-discussion-list"><table><tbody>
      <tr><td><a href="/subject/1/discussion/1/">讨论区话题</a></td></tr>
    </tbody></table></div>
  </div>
</body></html>`);

    expect(extractDiscussions(doc).topics).toHaveLength(1);
    expect(extractDiscussions(doc).topics[0]?.href).toBe(
      "https://www.douban.com/group/topic/1/"
    );
  });
});
