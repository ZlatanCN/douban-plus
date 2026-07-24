import { describe, expect, it } from "vitest";

import { extractSubjectCelebritiesPage } from "@/modules/subject-celebrities/extract/page";
import { mountSubjectCelebrities } from "@/modules/subject-celebrities/runtime/mount";

import { createTestDoc } from "../../helpers/doc";

describe(extractSubjectCelebritiesPage, () => {
  it("extracts every native credit group without assuming its order or size", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <main id="content">
          <h1>龙之家族 第一季 的全部演职员</h1>
          <div id="celebrities">
            <div class="list-wrapper">
              <h2>导演 Director</h2>
              <ul class="celebrities-list __multiline">
                <li class="celebrity">
                  <a href="https://www.douban.com/personage/27502526/"><div class="avatar" style="background-image: url(https://img.example.com/director.jpg)"></div></a>
                  <div class="info">
                    <span class="name"><a href="https://www.douban.com/personage/27502526/">米格尔·萨普什尼克 Miguel Sapochnik</a></span>
                    <span class="role">导演 Director</span>
                    <span class="works">代表作：<a href="https://movie.douban.com/subject/3016187/">芬奇</a></span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="list-wrapper">
              <h2>动作特技 Action or Stunts</h2>
              <ul class="celebrities-list __multiline">
                <li class="celebrity">
                  <div class="info"><span class="name">无肖像演职员</span></div>
                </li>
              </ul>
            </div>
          </div>
        </main>
      `,
      "/subject/34825964/celebrities"
    );

    expect(extractSubjectCelebritiesPage(doc)).toStrictEqual({
      groups: [
        {
          credits: [
            {
              avatar: "https://img.example.com/director.jpg",
              credit: "导演 Director",
              href: "https://www.douban.com/personage/27502526/",
              name: "米格尔·萨普什尼克 Miguel Sapochnik",
              works: [
                {
                  href: "https://movie.douban.com/subject/3016187/",
                  title: "芬奇",
                },
              ],
            },
          ],
          title: "导演 Director",
        },
        {
          credits: [
            {
              avatar: null,
              credit: null,
              href: null,
              name: "无肖像演职员",
              works: [],
            },
          ],
          title: "动作特技 Action or Stunts",
        },
      ],
      subjectHref: "https://movie.douban.com/subject/34825964/",
      subjectId: "34825964",
      title: "龙之家族 第一季",
    });

    cleanup();
  });

  it("refuses to adopt a page without a title or any usable credit groups", () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>空白作品 的全部演职员</h1></main>',
      "/subject/123/celebrities"
    );

    expect(extractSubjectCelebritiesPage(doc)).toBeNull();

    cleanup();
  });

  it("preserves empty titled groups and rejects an unparseable native credit", () => {
    const emptyGroup = createTestDoc(
      `
        <main id="content">
          <h1>作品甲 的全部演职员</h1>
          <div id="celebrities">
            <div class="list-wrapper"><h2>导演 Director</h2><ul class="celebrities-list"></ul></div>
            <div class="list-wrapper"><h2>演员 Cast</h2><ul class="celebrities-list">
              <li class="celebrity"><div class="info"><span class="name">演员甲</span></div></li>
            </ul></div>
          </div>
        </main>
      `,
      "/subject/123/celebrities"
    );
    const malformedCredit = createTestDoc(
      `
        <main id="content">
          <h1>作品乙 的全部演职员</h1>
          <div id="celebrities"><div class="list-wrapper"><h2>演员 Cast</h2><ul class="celebrities-list">
            <li class="celebrity"><div class="info">未标注姓名</div></li>
          </ul></div></div>
        </main>
      `,
      "/subject/456/celebrities"
    );

    expect(extractSubjectCelebritiesPage(emptyGroup.doc)?.groups).toStrictEqual(
      [
        { credits: [], title: "导演 Director" },
        {
          credits: [
            {
              avatar: null,
              credit: null,
              href: null,
              name: "演员甲",
              works: [],
            },
          ],
          title: "演员 Cast",
        },
      ]
    );
    expect(extractSubjectCelebritiesPage(malformedCredit.doc)).toBeNull();

    emptyGroup.cleanup();
    malformedCredit.cleanup();
  });

  it("extracts the alternate celebrity-card shape with optional fields absent", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <main id="content">
          <h1>祝你好运，里奥·格兰德 的全部演职员</h1>
          <div id="celebrities">
            <section class="list-wrapper">
              <h2>演员 Cast</h2>
              <ul class="celebrities-list">
                <li class="celebrity">
                  <a class="avatar" href="https://www.douban.com/personage/1000001/" style="background: center / cover url('https://img.example.com/emma.jpg')"></a>
                  <div class="info"><a class="name" href="https://www.douban.com/personage/1000001/">艾玛·汤普森</a></div>
                </li>
                <li class="celebrity">
                  <div class="avatar" style="background-image: linear-gradient(#000, #111), url(https://img.example.com/daryl.jpg)"></div>
                  <div class="info">
                    <a class="name" href="https://www.douban.com/celebrity/1000002/">达利尔·麦克科马克</a>
                    <span class="role">饰 Leo Grande</span>
                    <div class="works"><a href="https://movie.douban.com/subject/35000552/">浴血黑帮</a><a href="https://movie.douban.com/subject/35502937/">好兆头</a></div>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </main>
      `,
      "/subject/34825964/celebrities/"
    );

    expect(extractSubjectCelebritiesPage(doc)?.groups).toStrictEqual([
      {
        credits: [
          {
            avatar: "https://img.example.com/emma.jpg",
            credit: null,
            href: "https://www.douban.com/personage/1000001/",
            name: "艾玛·汤普森",
            works: [],
          },
          {
            avatar: "https://img.example.com/daryl.jpg",
            credit: "饰 Leo Grande",
            href: "https://www.douban.com/celebrity/1000002/",
            name: "达利尔·麦克科马克",
            works: [
              {
                href: "https://movie.douban.com/subject/35000552/",
                title: "浴血黑帮",
              },
              {
                href: "https://movie.douban.com/subject/35502937/",
                title: "好兆头",
              },
            ],
          },
        ],
        title: "演员 Cast",
      },
    ]);

    cleanup();
  });
});

describe(mountSubjectCelebrities, () => {
  it("mounts only after successful extraction and otherwise preserves the native page", () => {
    const ready = createTestDoc(
      `
        <div id="wrapper"><main id="content"><h1>作品甲 的全部演职员</h1>
          <div id="celebrities"><div class="list-wrapper"><h2>导演 Director</h2><ul class="celebrities-list">
            <li class="celebrity"><div class="info"><span class="name">导演甲</span></div></li>
          </ul></div></div>
        </main></div>
      `,
      "/subject/123/celebrities"
    );
    const fallback = createTestDoc(
      '<div id="wrapper"><main id="content"><h1>作品乙 的全部演职员</h1></main></div>',
      "/subject/456/celebrities"
    );

    mountSubjectCelebrities(ready.doc);
    mountSubjectCelebrities(fallback.doc);

    expect(ready.doc.body.classList).toContain("atv-enhanced");
    expect(ready.doc.querySelector("#atv-douban-root h1")?.textContent).toBe(
      "作品甲"
    );
    expect(fallback.doc.body.classList).not.toContain("atv-enhanced");
    expect(fallback.doc.querySelector("#atv-douban-root")).toBeNull();
    expect(fallback.doc.querySelector("#wrapper")?.textContent).toContain(
      "作品乙"
    );

    ready.cleanup();
    fallback.cleanup();
  });
});
