/* ── main.ts — Unit Tests ───────────────────────────────────── */
/* Tests page composition helpers. */

import { render } from "preact";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import { computeNavSections } from "@/components/layout/nav";
import { StickyNav } from "@/components/layout/sticky-nav";
import { SubjectPage } from "@/modules/subject-page/subject-page";
import type { SubjectPageRuntime } from "@/modules/subject-page/types";
import type { DoubanData, InfoBlock } from "@/types";

/* ── Setup GM_xmlhttpRequest mock ──────────────────────────── */
/* The $ virtual module (tests/mocks/$.ts) checks for           */
/* globalThis.GM_xmlhttpRequest at import time. We set it       */
/* before any module imports via vi.hoisted().                  */

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

/* ── Helpers ───────────────────────────────────────────────── */

const makeInfoBlock = (overrides?: Partial<InfoBlock>): InfoBlock => ({
  aliases: "",
  cast: [],
  country: "",
  director: [],
  episodeRuntime: "",
  episodes: "",
  firstAired: "",
  genres: [],
  imdb: "",
  language: "",
  releaseDate: "",
  runtime: "",
  seasons: "",
  writers: [],
  ...overrides,
});

const makeDoubanData = (overrides?: Partial<DoubanData>): DoubanData => ({
  awards: [],
  celebrities: [
    { avatar: "", link: "", name: "Tim Robbins", role: "" },
    { avatar: "", link: "", name: "Morgan Freeman", role: "" },
  ],
  comments: [
    {
      avatar: "",
      cid: "1",
      content: "Great!",
      link: "",
      name: "User",
      ratingWord: "力荐",
      stars: 5,
      time: "2024-01-01",
      voted: false,
      votes: 10,
    },
  ],
  discussions: { topics: [] },
  info: makeInfoBlock({
    country: "USA",
    director: [{ href: "", text: "Frank Darabont" }],
    genres: ["Drama"],
    language: "English",
    releaseDate: "1994-09-23",
    runtime: "142",
  }),
  interest: {
    ck: "",
    comment: "",
    date: "",
    hasWatching: false,
    loggedIn: false,
    marked: false,
    rating: 0,
    status: "none" as const,
    tags: [],
    usefulCount: "",
  },
  isTV: false,
  photos: [
    {
      hdUrl: "https://example.com/hd.jpg",
      link: "",
      thumbUrl: "https://example.com/thumb.jpg",
    },
  ],
  poster: null,
  rankLabel: null,
  rating: { count: 2_345_678, score: 9.7 },
  recommendations: [{ link: "", poster: "", title: "The Godfather" }],
  reviews: [],
  series: [],
  streaming: [{ href: "https://netflix.com", name: "Netflix" }],
  subjectId: "1292052",
  summary: "A moving story of hope and friendship",
  title: {
    full: "The Shawshank Redemption",
    original: "",
    primary: "肖申克的救赎",
  },
  trailers: [],
  year: "1994",
  ...overrides,
});

/* ── SubjectPage runtime helper ──────────────────────────── */

const makeRuntime = (
  data: DoubanData,
  overrides?: Partial<SubjectPageRuntime>
): SubjectPageRuntime => ({
  actions: {
    handleCommentVote: () => Promise.resolve({ ok: true }),
    handleReviewVote: () => Promise.resolve({ ok: true }),
    interestMarking: {
      post: () => Promise.resolve({ ok: false }),
      reload: () => {},
      remove: () => Promise.resolve({ ok: false }),
    },
  },
  externalRatings: null,
  firstBroadcastPlatform: null,
  navigation: {
    activeSectionId: "",
    navRef: { current: null },
    onJump: () => {},
    scrolling: false,
    sections: computeNavSections(data),
    visible: false,
  },
  resolvedComments: data.comments,
  series: [],
  summary: data.summary,
  ...overrides,
});

const renderSubjectPage = (
  data: DoubanData = makeDoubanData(),
  runtime: SubjectPageRuntime = makeRuntime(data)
): HTMLElement => {
  const root = document.createElement("div");
  root.id = "atv-douban-root";
  render(<SubjectPage data={data} runtime={runtime} />, root);
  onTestFinished(() => render(null, root));
  return root;
};

describe("Subject page runtime value", () => {
  it("renders a runtime-supplied comment avatar in the list and modal", async () => {
    const profileLink = "https://www.douban.com/people/page-avatar/";
    const avatarUrl = "https://example.com/page-avatar.jpg";
    const data = makeDoubanData({
      comments: [
        {
          ...makeDoubanData().comments[0],
          avatar: "",
          cid: "page-avatar",
          link: profileLink,
        },
      ],
    });

    const root = renderSubjectPage(
      data,
      makeRuntime(data, {
        resolvedComments: [{ ...data.comments[0], avatar: avatarUrl }],
      })
    );

    expect(
      root
        .querySelector<HTMLElement>(
          "[data-cid='page-avatar'] .atv-comment-avatar"
        )
        ?.getAttribute("style")
    ).toContain(avatarUrl);

    root.querySelector<HTMLButtonElement>(".atv-comment-expand")?.click();
    await Promise.resolve();

    expect(
      root
        .querySelector<HTMLElement>(".atv-comment-overlay-avatar")
        ?.getAttribute("style")
    ).toContain(avatarUrl);
  });
});

const renderStickyNav = (data: DoubanData = makeDoubanData()): HTMLElement => {
  const stickyNav = document.createElement("nav");
  stickyNav.className = "atv-stickynav";
  render(
    <StickyNav
      onJump={() => {}}
      sections={computeNavSections(data)}
      title={data.title}
    />,
    stickyNav
  );
  onTestFinished(() => render(null, stickyNav));
  return stickyNav;
};

/* ── NavSection references ──────────────────────────────────── */

const S = {
  cast: { id: "atv-cast", label: "演职员" },
  comments: { id: "atv-comments", label: "短评" },
  info: { id: "atv-info", label: "详情" },
  movieReviews: { id: "atv-reviews", label: "影评" },
  photos: { id: "atv-photos", label: "影像" },
  recs: { id: "atv-recs", label: "相似作品" },
  series: { id: "atv-series", label: "同系列" },
  stream: { id: "atv-stream", label: "观看平台" },
  tvReviews: { id: "atv-reviews", label: "剧评" },
} as const;

/* ═══════════════════════════════════════════════════════════ */
/* ── computeNavSections ──────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe(computeNavSections, () => {
  it("returns all expected sections for complete data (t1)", () => {
    const result = computeNavSections(makeDoubanData());
    expect(result).toStrictEqual([
      S.stream,
      S.cast,
      S.photos,
      S.comments,
      S.recs,
      S.info,
    ]);
  });

  it("excludes streaming section when streaming array empty (t2)", () => {
    const result = computeNavSections(makeDoubanData({ streaming: [] }));
    expect(result.find((s) => s.id === "atv-stream")).toBeUndefined();
  });

  it("excludes cast section when celebrities array empty (t3)", () => {
    const result = computeNavSections(makeDoubanData({ celebrities: [] }));
    expect(result.find((s) => s.id === "atv-cast")).toBeUndefined();
  });

  it("excludes photos section when photos and trailers both empty (t4)", () => {
    const result = computeNavSections(
      makeDoubanData({ photos: [], trailers: [] })
    );
    expect(result.find((s) => s.id === "atv-photos")).toBeUndefined();
  });

  it("includes photos section when trailers exist even if photos empty (t5)", () => {
    const data = makeDoubanData({
      photos: [],
      trailers: [{ thumbUrl: "", title: "预告片", trailerPageUrl: "" }],
    });
    const result = computeNavSections(data);
    expect(result.find((s) => s.id === "atv-photos")).toStrictEqual(S.photos);
  });

  it("excludes comments section when comments array empty (t6)", () => {
    const result = computeNavSections(makeDoubanData({ comments: [] }));
    expect(result.find((s) => s.id === "atv-comments")).toBeUndefined();
  });

  it("excludes recs section when recommendations array empty (t7)", () => {
    const result = computeNavSections(makeDoubanData({ recommendations: [] }));
    expect(result.find((s) => s.id === "atv-recs")).toBeUndefined();
  });

  it("still includes info section when all optional data empty (t8)", () => {
    const data = makeDoubanData({
      celebrities: [],
      comments: [],
      photos: [],
      recommendations: [],
      streaming: [],
      trailers: [],
    });
    const result = computeNavSections(data);
    expect(result).toStrictEqual([S.info]);
  });

  it("returns sections in consistent rendering order (t9)", () => {
    const data = makeDoubanData({ celebrities: [], trailers: [] });
    const result = computeNavSections(data);
    expect(result).toStrictEqual([
      S.stream,
      S.photos,
      S.comments,
      S.recs,
      S.info,
    ]);
  });

  it("gives every section a non-empty label (t10)", () => {
    const result = computeNavSections(makeDoubanData());
    for (const section of result) {
      expect(section.label.length).toBeGreaterThan(0);
    }
  });

  it("uses relationship and media-type labels at the navigation seam", () => {
    const review = {
      avatar: "",
      content: "Content",
      id: "r1",
      link: "",
      name: "User",
      ratingWord: "",
      spoiler: false,
      stars: 0,
      time: "",
      title: "Review",
      usefulCount: 0,
      uselessCount: 0,
    };
    const series = { link: "", poster: "", rating: "", title: "Season 1" };
    const movieSections = computeNavSections(
      makeDoubanData({ reviews: [review], series: [series] })
    );
    const tvSections = computeNavSections(
      makeDoubanData({ isTV: true, reviews: [review], series: [series] })
    );

    expect([
      movieSections.find((section) => section.id === "atv-series"),
      movieSections.find((section) => section.id === "atv-reviews"),
      tvSections.find((section) => section.id === "atv-reviews"),
    ]).toStrictEqual([S.series, S.movieReviews, S.tvReviews]);
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* ── SubjectPage ─────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe(SubjectPage, () => {
  it("builds root element with correct id (t23)", () => {
    const root = renderSubjectPage();
    expect(root.id).toBe("atv-douban-root");
  });

  it("returns stickyNav with correct structure (t24)", () => {
    const stickyNav = renderStickyNav();
    expect(stickyNav.classList.contains("atv-stickynav")).toBeTruthy();
  });

  it("renders hero and main content sections when data is complete (t25a)", () => {
    const root = renderSubjectPage();
    expect(root.querySelector(".atv-hero")).not.toBeNull();
    expect(root.querySelector("#atv-stream")).not.toBeNull();
    expect(root.querySelector("#atv-cast")).not.toBeNull();
    expect(root.querySelector("#atv-photos")).not.toBeNull();
  });

  it("renders comments, recs and info sections when data is complete (t25b)", () => {
    const root = renderSubjectPage();
    expect(root.querySelector("#atv-comments")).not.toBeNull();
    expect(root.querySelector("#atv-recs")).not.toBeNull();
    expect(root.querySelector("#atv-info")).not.toBeNull();
  });

  it("omits streaming section when streaming array is empty (t26)", () => {
    const root = renderSubjectPage(makeDoubanData({ streaming: [] }));
    expect(root.querySelector("#atv-stream")).toBeNull();
  });

  it("omits cast section when celebrities array is empty (t27)", () => {
    const root = renderSubjectPage(makeDoubanData({ celebrities: [] }));
    expect(root.querySelector("#atv-cast")).toBeNull();
  });

  it("omits photos section when both photos and trailers are empty (t28)", () => {
    const root = renderSubjectPage(
      makeDoubanData({ photos: [], trailers: [] })
    );
    expect(root.querySelector("#atv-photos")).toBeNull();
  });

  it("includes photos section when trailers exist even if photos empty (t29)", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        photos: [],
        trailers: [{ thumbUrl: "", title: "预告片", trailerPageUrl: "" }],
      })
    );
    expect(root.querySelector("#atv-photos")).not.toBeNull();
  });

  it("omits comments section when comments array is empty (t30)", () => {
    const root = renderSubjectPage(makeDoubanData({ comments: [] }));
    expect(root.querySelector("#atv-comments")).toBeNull();
  });

  it("omits recs section when recommendations array is empty (t31)", () => {
    const root = renderSubjectPage(makeDoubanData({ recommendations: [] }));
    expect(root.querySelector("#atv-recs")).toBeNull();
  });

  it("details section is always present even when all optional data empty (t32)", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        celebrities: [],
        comments: [],
        info: {
          ...makeInfoBlock(),
          director: [{ href: "", text: "Frank Darabont" }],
        },
        photos: [],
        recommendations: [],
        streaming: [],
        trailers: [],
      })
    );
    expect(root.querySelector("#atv-info")).not.toBeNull();
  });

  it("includes footer spacer element (t33)", () => {
    const root = renderSubjectPage();
    expect(root.querySelector(".atv-footer-spacer")).not.toBeNull();
  });

  it("handles empty series gracefully — no series section (t34)", () => {
    const root = renderSubjectPage(makeDoubanData({ series: [] }));
    expect(root.querySelector("#atv-series")).toBeNull();
  });

  it("renders group discussions between reviews and similar works", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        discussions: {
          topics: [
            {
              href: "https://www.douban.com/group/topic/480926084/",
              title: "才开始追！乔佛里好恶心啊",
            },
          ],
        },
        reviews: [
          {
            avatar: "",
            content: "一篇剧评",
            id: "r1",
            link: "",
            name: "作者",
            ratingWord: "",
            spoiler: false,
            stars: 0,
            time: "",
            title: "剧评标题",
            usefulCount: 0,
            uselessCount: 0,
          },
        ],
      })
    );
    const topicLink = root.querySelector<HTMLAnchorElement>(
      ".atv-discussion-topic-link"
    );
    const sectionOrder = [...root.querySelectorAll<HTMLElement>(".atv-section")]
      .map((section) => section.id)
      .filter((id) =>
        ["atv-reviews", "atv-discussions", "atv-recs"].includes(id)
      );
    const navOrder = [
      ...root.querySelectorAll<HTMLAnchorElement>(".atv-stickynav-jumps a"),
    ]
      .map((link) => link.textContent)
      .filter((label) =>
        ["影评", "小组讨论", "相似作品"].includes(label ?? "")
      );

    expect({
      heading: root.querySelector("#atv-discussions h2")?.textContent,
      navOrder,
      sectionOrder,
      topic: {
        href: topicLink?.href,
        label: topicLink?.getAttribute("aria-label"),
        rel: topicLink?.rel,
        target: topicLink?.target,
      },
    }).toStrictEqual({
      heading: "小组讨论",
      navOrder: ["影评", "小组讨论", "相似作品"],
      sectionOrder: ["atv-reviews", "atv-discussions", "atv-recs"],
      topic: {
        href: "https://www.douban.com/group/topic/480926084/",
        label: "打开讨论：才开始追！乔佛里好恶心啊",
        rel: "noopener",
        target: "_blank",
      },
    });
  });

  it("renders discussion metadata and collection entry points", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        discussions: {
          allDiscussions: {
            href: "https://www.douban.com/group/653616#topics",
            total: 15_166,
          },
          startDiscussionHref: "https://www.douban.com/group/653616",
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
        },
      })
    );
    const author = root.querySelector<HTMLAnchorElement>(
      ".atv-discussion-author"
    );
    const activityTime = root.querySelector<HTMLTimeElement>(
      ".atv-discussion-activity time"
    );
    const startDiscussion = root.querySelector<HTMLAnchorElement>(
      "#atv-discussions .atv-section-more"
    );
    const allDiscussions = root.querySelector<HTMLAnchorElement>(
      ".atv-discussion-footer a"
    );

    expect({
      activity: root.querySelector(".atv-discussion-activity")?.textContent,
      allDiscussions: {
        href: allDiscussions?.href,
        rel: allDiscussions?.rel,
        target: allDiscussions?.target,
        text: allDiscussions?.textContent,
      },
      author: {
        href: author?.href,
        rel: author?.rel,
        target: author?.target,
        text: author?.textContent,
      },
      startDiscussion: {
        href: startDiscussion?.href,
        rel: startDiscussion?.rel,
        target: startDiscussion?.target,
        text: startDiscussion?.textContent,
      },
      time: {
        dateTime: activityTime?.dateTime,
        title: activityTime?.title,
      },
    }).toStrictEqual({
      activity: "0 回应2026-07-0916:31",
      allDiscussions: {
        href: "https://www.douban.com/group/653616#topics",
        rel: "noopener",
        target: "_blank",
        text: "查看全部 15,166 条讨论 →",
      },
      author: {
        href: "https://www.douban.com/people/127190935/",
        rel: "noopener",
        target: "_blank",
        text: "🍈",
      },
      startDiscussion: {
        href: "https://www.douban.com/group/653616",
        rel: "noopener",
        target: "_blank",
        text: "发起讨论 ↗",
      },
      time: {
        dateTime: "2026-07-09T16:31:45",
        title: "2026-07-09 16:31:45",
      },
    });
  });

  it("groups discussion metadata after its title without changing keyboard order", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        discussions: {
          allDiscussions: {
            href: "https://www.douban.com/group/653616#topics",
          },
          startDiscussionHref: "https://www.douban.com/group/653616",
          topics: [
            {
              activity: {
                date: "2026-07-09",
                dateTime: "2026-07-09T16:31:45",
                raw: "2026-07-09 16:31:45",
                time: "16:31",
              },
              author: {
                href: "https://www.douban.com/people/very-long-author-name/",
                name: "一个很长很长很长很长很长很长很长很长的作者名字",
              },
              href: "https://www.douban.com/group/topic/480926084/",
              replies: 64,
              title:
                "一个很长很长很长很长很长很长很长很长很长很长很长很长很长的讨论标题",
            },
          ],
        },
      })
    );
    const section = root.querySelector("#atv-discussions");
    const metadata = section?.querySelector(".atv-discussion-meta");
    const focusOrder = [
      ...(section?.querySelectorAll<HTMLAnchorElement>("a") ?? []),
    ].map((link) => link.getAttribute("aria-label") ?? link.textContent);

    expect({
      focusOrder,
      metadata: metadata?.textContent,
      title: section?.querySelector(".atv-discussion-title")?.textContent,
    }).toStrictEqual({
      focusOrder: [
        "发起讨论 ↗",
        "打开讨论：一个很长很长很长很长很长很长很长很长很长很长很长很长很长的讨论标题",
        "一个很长很长很长很长很长很长很长很长的作者名字",
        "查看全部讨论 →",
      ],
      metadata:
        "一个很长很长很长很长很长很长很长很长的作者名字64 回应2026-07-0916:31",
      title:
        "一个很长很长很长很长很长很长很长很长很长很长很长很长很长的讨论标题",
    });
  });

  it("degrades optional discussion metadata and actions independently", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        discussions: {
          allDiscussions: {
            href: "https://www.douban.com/group/653616#topics",
          },
          topics: [
            {
              activity: { raw: "昨天" },
              author: { name: "匿名" },
              href: "https://www.douban.com/group/topic/480926084/",
              title: "讨论主题",
            },
          ],
        },
      })
    );
    const author = root.querySelector(".atv-discussion-author");
    const time = root.querySelector<HTMLTimeElement>(
      ".atv-discussion-activity time"
    );

    expect({
      activity: root.querySelector(".atv-discussion-activity")?.textContent,
      author: { tag: author?.tagName, text: author?.textContent },
      footer: root.querySelector(".atv-discussion-footer a")?.textContent,
      replies: root.querySelector(".atv-discussion-replies"),
      startDiscussion: root.querySelector("#atv-discussions .atv-section-more"),
      time: { dateTime: time?.dateTime, text: time?.textContent },
    }).toStrictEqual({
      activity: "昨天",
      author: { tag: "SPAN", text: "匿名" },
      footer: "查看全部讨论 →",
      replies: null,
      startDiscussion: null,
      time: { dateTime: "", text: "昨天" },
    });
  });

  it("keeps the start-discussion action when the collection footer is absent", () => {
    const root = renderSubjectPage(
      makeDoubanData({
        discussions: {
          startDiscussionHref: "https://www.douban.com/group/653616",
          topics: [
            {
              href: "https://www.douban.com/group/topic/480926084/",
              title: "讨论主题",
            },
          ],
        },
      })
    );

    expect({
      footer: root.querySelector(".atv-discussion-footer"),
      startDiscussion: root.querySelector<HTMLAnchorElement>(
        "#atv-discussions .atv-section-more"
      )?.textContent,
    }).toStrictEqual({ footer: null, startDiscussion: "发起讨论 ↗" });
  });

  it("omits group discussions and their navigation when topics are empty", () => {
    const root = renderSubjectPage(makeDoubanData());

    expect({
      nav: root.querySelector('a[href="#atv-discussions"]'),
      section: root.querySelector("#atv-discussions"),
    }).toStrictEqual({ nav: null, section: null });
  });

  it.each([
    ["movie", false],
    ["TV", true],
  ])("renders group discussions for %s subjects", (_kind, isTV) => {
    const root = renderSubjectPage(
      makeDoubanData({
        discussions: {
          topics: [
            {
              href: "https://www.douban.com/group/topic/480926084/",
              title: "讨论主题",
            },
          ],
        },
        isTV,
      })
    );

    expect({
      nav: root.querySelector('a[href="#atv-discussions"]')?.textContent,
      section: root.querySelector("#atv-discussions h2")?.textContent,
    }).toStrictEqual({ nav: "小组讨论", section: "小组讨论" });
  });
});
