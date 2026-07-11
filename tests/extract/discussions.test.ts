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

  it("returns an empty topic collection when the native section is absent", () => {
    const doc = buildDoc("<!DOCTYPE html><html><body></body></html>");

    expect(extractDiscussions(doc)).toStrictEqual({ topics: [] });
  });
});
