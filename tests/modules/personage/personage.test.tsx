import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { extractPersonageProfile } from "@/modules/personage/extract";
import { isPersonageHomepage, mountPersonage } from "@/runtime/personage-mount";

import { createTestDoc } from "../../helpers/doc";

const personageFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/personage-full.html"),
  "utf-8"
);

const mockBiographyLayout = (scrollHeight: number, lineHeight = 28) => {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    scrollHeight
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    lineHeight: `${lineHeight}px`,
  } as CSSStyleDeclaration);
};

describe(extractPersonageProfile, () => {
  it("extracts the Hero identity, facts, portrait, and biography from a personage document", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    expect(extractPersonageProfile(doc)).toStrictEqual({
      awards: {
        allAwardsHref: "http://localhost:3000/awards",
        awards: [
          {
            award: "最佳男演员 (提名)",
            ceremony: "示例电影节",
            ceremonyHref: "https://movie.douban.com/awards/example/1/",
            work: "代表作品",
            workHref: "https://movie.douban.com/subject/20002/",
            year: "2024年",
          },
        ],
      },
      biography: [
        "彼特·丁拉基是一位美国演员，以细腻而有力量的表演闻名。",
        "他因出演《权力的游戏》中的提利昂·兰尼斯特而广为人知。",
      ],
      collaborators: [
        {
          avatar: "https://img.example.com/b.jpg",
          href: "https://www.douban.com/personage/2",
          name: "合作者乙",
          sharedWorkCount: 20,
          sharedWorksHref:
            "http://localhost:3000/personage/27224733/partners#2",
        },
        {
          avatar: "https://img.example.com/a.jpg",
          href: "https://www.douban.com/personage/1",
          name: "合作者甲",
          sharedWorkCount: 12,
          sharedWorksHref:
            "http://localhost:3000/personage/27224733/partners#1",
        },
        {
          avatar: "https://img.example.com/c.jpg",
          href: "https://www.douban.com/personage/3",
          name: "合作者丙",
          sharedWorkCount: 12,
          sharedWorksHref:
            "http://localhost:3000/personage/27224733/partners#3",
        },
      ],
      facts: [
        { label: "性别", value: "男" },
        { label: "出生日期", value: "1969-06-11" },
        { label: "职业", value: "演员 / 制片人" },
      ],
      gallery: {
        allImagesHref: "http://localhost:3000/photos",
        images: [
          {
            alt: "",
            largeSrc:
              "https://img.example.com/view/photo/l/public/peter-1.webp",
            src: "https://img.example.com/view/photo/photo/public/peter-1.webp",
          },
          {
            alt: "",
            largeSrc:
              "https://img.example.com/view/photo/l/public/peter-2.webp",
            src: "https://img.example.com/view/photo/photo/public/peter-2.webp",
          },
        ],
      },
      id: "27224733",
      name: "彼特·丁拉基 Peter Dinklage",
      portrait: "https://img.example.com/peter.jpg",
      recentWorks: {
        allWorksHref:
          "http://localhost:3000/creations?sortby=time&type=filmmaker",
        works: [
          {
            href: "https://movie.douban.com/subject/10001/",
            poster: "https://img.example.com/recent.jpg",
            rating: "8.2",
            title: "近期作品",
          },
        ],
      },
      representativeWorks: {
        allWorksHref:
          "http://localhost:3000/creations?sortby=collection&type=filmmaker",
        works: [
          {
            href: "https://movie.douban.com/subject/20002/",
            poster: "https://img.example.com/representative.jpg",
            rating: "9.1",
            title: "代表作品",
          },
        ],
      },
    });

    cleanup();
  });

  it("extracts a name when the native personage markup has no heading element", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target">
          <div class="subject-name">娜奥米·沃茨 Naomi Watts</div>
        </div>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(doc)?.name).toBe("娜奥米·沃茨 Naomi Watts");

    cleanup();
  });

  it("keeps missing and explicitly empty native picture sections distinct", () => {
    const missing = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );
    const empty = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-picture"><a href="/personage/27260187/photos">全部 0 张</a></section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(missing.doc)?.gallery).toBeNull();
    expect(extractPersonageProfile(empty.doc)?.gallery).toStrictEqual({
      allImagesHref: "http://localhost:3000/personage/27260187/photos",
      images: [],
    });

    missing.cleanup();
    empty.cleanup();
  });

  it("keeps missing and explicitly empty native collaborator sources distinct", () => {
    const missing = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );
    const empty = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="partners-mod-mod subject-mod"><ul class="partners-mod-list"></ul></section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(missing.doc)?.collaborators).toBeNull();
    expect(extractPersonageProfile(empty.doc)?.collaborators).toStrictEqual([]);

    missing.cleanup();
    empty.cleanup();
  });

  it("keeps missing and explicitly empty native award sections distinct", () => {
    const missing = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );
    const empty = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-awards">
          <h2>获奖情况 <a href="awards">全部 0</a></h2>
          <ul></ul>
        </section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(missing.doc)?.awards).toBeNull();
    expect(extractPersonageProfile(empty.doc)?.awards).toStrictEqual({
      allAwardsHref: "http://localhost:3000/awards",
      awards: [],
    });

    missing.cleanup();
    empty.cleanup();
  });

  it("keeps an empty recent-work source distinct from a populated representative-work source", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-creations">
          <h2>最近的 5 部作品 <a href="creations?sortby=time">更多影视作品</a></h2>
          <ul class="works"></ul>
        </section>
        <section class="subject-mod subject-creations">
          <h2>收藏人数最多的 5 部作品 <a href="creations?sortby=collection">更多影视作品</a></h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/3/" title="活着">
                <img src="https://img.example.com/to-live.jpg" />
              </a>
            </li>
          </ul>
        </section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(doc)?.recentWorks).toStrictEqual({
      allWorksHref: "http://localhost:3000/creations?sortby=time",
      works: [],
    });
    expect(extractPersonageProfile(doc)?.representativeWorks).toStrictEqual({
      allWorksHref: "http://localhost:3000/creations?sortby=collection",
      works: [
        {
          href: "https://movie.douban.com/subject/3/",
          poster: "https://img.example.com/to-live.jpg",
          rating: null,
          title: "活着",
        },
      ],
    });

    cleanup();
  });
});

describe(mountPersonage, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("mounts a Hero and activates the enhanced document only after extraction succeeds", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);

    expect(doc.body.classList).toContain("atv-enhanced");
    expect(
      doc.querySelector("#atv-douban-root .atv-personage-hero")
    ).not.toBeNull();
    expect([
      doc.querySelector(".atv-personage-hero h1")?.textContent,
      doc.querySelector(".atv-personage-original-name")?.textContent,
    ]).toStrictEqual(["彼特·丁拉基", "Peter Dinklage"]);
    expect(doc.querySelectorAll(".atv-personage-biography p")).toHaveLength(2);
    expect(doc.title).toBe("彼特·丁拉基 Peter Dinklage · 豆瓣");

    cleanup();
  });

  it("renders the two work rails after images in the confirmed reading order", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);

    const sections = [
      "atv-personage-collaborators",
      "atv-personage-gallery",
      "atv-personage-recent-works",
      "atv-personage-representative-works",
      "atv-personage-awards",
    ].map((id) => doc.querySelector<HTMLElement>(`#${id}`));

    expect(sections.map((section) => section?.id)).toStrictEqual([
      "atv-personage-collaborators",
      "atv-personage-gallery",
      "atv-personage-recent-works",
      "atv-personage-representative-works",
      "atv-personage-awards",
    ]);
    expect(
      sections[2]?.querySelector<HTMLAnchorElement>(".atv-section-more")?.href
    ).toBe("http://localhost:3000/creations?sortby=time&type=filmmaker");
    expect(
      sections[3]?.querySelector<HTMLAnchorElement>(".atv-section-more")?.href
    ).toBe("http://localhost:3000/creations?sortby=collection&type=filmmaker");

    cleanup();
  });

  it("leaves a personage document unchanged when the Hero data cannot be extracted", () => {
    const { cleanup, doc } = createTestDoc(
      '<div id="wrapper"><div id="content"><h1>原生页面</h1></div></div>',
      "/personage/27224733/"
    );

    mountPersonage(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();

    cleanup();
  });

  it("opens the portrait in the shared image modal", async () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);
    doc
      .querySelector<HTMLButtonElement>(".atv-personage-portrait-trigger")
      ?.click();
    await Promise.resolve();

    expect(
      doc.querySelector("#atv-poster-modal .atv-modal-img")?.getAttribute("src")
    ).toBe("https://img.example.com/peter.jpg");

    cleanup();
  });

  it("renders a populated representative-work rail when the recent-work rail is empty", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-creations">
          <h2>最近的 5 部作品</h2><ul class="works"></ul>
        </section>
        <section class="subject-mod subject-creations">
          <h2>收藏人数最多的 5 部作品</h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/3/" title="活着">
                <img src="https://img.example.com/to-live.jpg" />
              </a>
            </li>
          </ul>
        </section>
      `,
      "/personage/27260187/"
    );

    mountPersonage(doc);

    expect(doc.querySelector("#atv-personage-recent-works")).toBeNull();
    expect(
      doc.querySelector("#atv-personage-representative-works h2")?.textContent
    ).toBe("代表作品");

    cleanup();
  });

  it("adopts work rails that arrive after the personage page first mounts", async () => {
    const { cleanup, doc } = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );

    mountPersonage(doc);
    doc.body.insertAdjacentHTML(
      "beforeend",
      `
        <section class="subject-mod subject-creations">
          <h2>最近的 5 部作品</h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/3/" title="活着">
                <img src="https://img.example.com/to-live.jpg" />
              </a>
            </li>
          </ul>
        </section>
        <section class="subject-mod subject-creations">
          <h2>收藏人数最多的 5 部作品</h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/4/" title="霸王别姬">
                <img src="https://img.example.com/farewell.jpg" />
              </a>
            </li>
          </ul>
        </section>
      `
    );
    await vi.waitFor(() =>
      expect(doc.querySelector("#atv-personage-recent-works")).not.toBeNull()
    );
    expect(
      doc.querySelector("#atv-personage-representative-works")
    ).not.toBeNull();

    cleanup();
  });

  it("adopts a biography that the native source expands after mounting", async () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">张艺谋 Yimou Zhang</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27260166/"
    );
    const source = doc.querySelector<HTMLElement>(".subject-intro .content");
    const toggle = doc.querySelector<HTMLAnchorElement>(".fold-switch");

    toggle?.addEventListener("click", () => {
      source?.replaceChildren(
        Object.assign(doc.createElement("p"), {
          textContent: "原生展开后才提供的完整人物简介",
        })
      );
      if (toggle) {
        toggle.textContent = "(收起)";
      }
    });
    Object.defineProperty(doc, "readyState", {
      configurable: true,
      value: "complete",
    });

    mountPersonage(doc);

    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography-content")?.textContent
      ).toBe("原生展开后才提供的完整人物简介")
    );

    cleanup();
  });

  it("adopts a biography only after the page-load boundary makes native expansion available", async () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">冯小刚 Xiaogang Feng</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27481219/"
    );
    const source = doc.querySelector<HTMLElement>(".subject-intro .content");
    const toggle = doc.querySelector<HTMLAnchorElement>(".fold-switch");

    Object.defineProperty(doc, "readyState", {
      configurable: true,
      value: "interactive",
    });
    mountPersonage(doc);

    expect(doc.querySelector("#atv-douban-root")).toBeNull();

    toggle?.addEventListener("click", () => {
      source?.replaceChildren(
        Object.assign(doc.createElement("p"), {
          textContent: "延后绑定后提供的完整人物简介",
        })
      );
      if (toggle) {
        toggle.textContent = "(折叠)";
      }
    });
    doc.defaultView?.dispatchEvent(new Event("load"));

    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography-content")?.textContent
      ).toBe("延后绑定后提供的完整人物简介")
    );

    cleanup();
  });

  it("keeps the native page visible when biography expansion cannot complete", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">冯小刚 Xiaogang Feng</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27481219/"
    );

    Object.defineProperty(doc, "readyState", {
      configurable: true,
      value: "interactive",
    });
    mountPersonage(doc);
    doc.defaultView?.dispatchEvent(new Event("load"));

    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.body.classList).not.toContain("atv-enhanced");

    cleanup();
  });

  it("expands the biography inside the Hero", async () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mockBiographyLayout(112);
    mountPersonage(doc);
    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography button")
      ).not.toBeNull()
    );
    const button = doc.querySelector<HTMLButtonElement>(
      ".atv-personage-biography button"
    );

    button?.click();
    await Promise.resolve();

    expect(
      doc
        .querySelector<HTMLButtonElement>(".atv-personage-biography button")
        ?.getAttribute("aria-expanded")
    ).toBe("true");
    expect(
      doc.querySelector<HTMLButtonElement>(".atv-personage-biography button")
        ?.textContent
    ).toBe("收起");

    cleanup();
  });

  it("does not render an expand control when the biography fits three lines", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mockBiographyLayout(84);
    mountPersonage(doc);

    expect(doc.querySelector(".atv-personage-biography button")).toBeNull();
    expect(
      doc.querySelector(".atv-personage-biography-content")?.classList
    ).toContain("is-expanded");

    cleanup();
  });
});

describe(isPersonageHomepage, () => {
  it("accepts only canonical numeric personage homepages", () => {
    expect(
      isPersonageHomepage({
        hostname: "www.douban.com",
        pathname: "/personage/27224733/",
      })
    ).toBeTruthy();
    expect(
      isPersonageHomepage({
        hostname: "www.douban.com",
        pathname: "/personage/27224733/photos",
      })
    ).toBeFalsy();
    expect(
      isPersonageHomepage({
        hostname: "movie.douban.com",
        pathname: "/personage/27224733/",
      })
    ).toBeFalsy();
  });
});
