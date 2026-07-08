/* ── main.ts — Unit Tests ───────────────────────────────────── */
/* Tests computeNavSections() and buildHeroCallbacks() from      */
/* src/main.ts.                                                  */

import { render } from "preact";
import { describe, it, expect, vi, afterEach } from "vitest";

import { computeNavSections } from "../src/components/layout/nav";
import { StickyNav } from "../src/components/layout/sticky-nav";
import { buildHeroCallbacks, watchSeries } from "../src/main";
import { SubjectPage } from "../src/modules/subject-page";
import type { SubjectPageDeps } from "../src/modules/subject-page";
import type { DoubanData, InfoBlock, InterestState } from "../src/types";

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

/* ── SubjectPage deps helper ─────────────────────────────── */

const makeDeps = (overrides?: Partial<SubjectPageDeps>): SubjectPageDeps => ({
  handleVote: () => Promise.resolve({ ok: true }),
  ...overrides,
  heroCallbacks: {
    handleCollectClick: () => {},
    handleOpenInterest: () => {},
    handleWatchingClick: () => {},
    handleWishClick: () => {},
  },
});

const renderSubjectPage = (
  data: DoubanData = makeDoubanData(),
  deps: SubjectPageDeps = makeDeps()
): HTMLElement => {
  const root = document.createElement("div");
  root.id = "atv-douban-root";
  render(<SubjectPage data={data} deps={deps} />, root);
  return root;
};

const renderStickyNav = (data: DoubanData = makeDoubanData()): HTMLElement => {
  const stickyNav = document.createElement("nav");
  stickyNav.className = "atv-stickynav";
  render(
    <StickyNav sections={computeNavSections(data)} title={data.title} />,
    stickyNav
  );
  return stickyNav;
};

/* ── NavSection references ──────────────────────────────────── */

const S = {
  cast: { id: "atv-cast", label: "演职员" },
  comments: { id: "atv-comments", label: "短评" },
  info: { id: "atv-info", label: "详情" },
  photos: { id: "atv-photos", label: "剧照" },
  recs: { id: "atv-recs", label: "相似作品" },
  stream: { id: "atv-stream", label: "在哪儿看" },
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
});

/* ═══════════════════════════════════════════════════════════ */
/* ── buildHeroCallbacks ──────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

const defaultInterest: InterestState = {
  ck: "",
  comment: "",
  date: "",
  hasWatching: false,
  loggedIn: false,
  marked: false,
  rating: 0,
  status: "none",
  tags: [],
  usefulCount: "",
};

const stubRaf = (): void => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(
    // oxlint-disable-next-line promise/prefer-await-to-callbacks
    (cb: FrameRequestCallback): number => {
      // oxlint-disable-next-line promise/prefer-await-to-callbacks
      cb(0);
      return 0;
    }
  );
};

const unstubRaf = (): void => {
  vi.restoreAllMocks();
};

const cleanupModal = (): void => {
  document.querySelector("#atv-interest-modal")?.remove();
  document.body.style.overflow = "";
};

describe(buildHeroCallbacks, () => {
  afterEach(() => {
    unstubRaf();
    cleanupModal();
  });

  it("returns object with four callback functions (t11)", () => {
    const cbs = buildHeroCallbacks("1292052");
    expect(cbs.handleCollectClick).toBeTypeOf("function");
    expect(cbs.handleOpenInterest).toBeTypeOf("function");
    expect(cbs.handleWatchingClick).toBeTypeOf("function");
    expect(cbs.handleWishClick).toBeTypeOf("function");
  });

  it("does not throw when calling handleWishClick (t12)", () => {
    const cbs = buildHeroCallbacks("1292052");
    expect(() => cbs.handleWishClick()).not.toThrow();
  });

  it("does not throw when calling handleWatchingClick (t13)", () => {
    const cbs = buildHeroCallbacks("1292052");
    expect(() => cbs.handleWatchingClick()).not.toThrow();
  });

  it("does not throw when calling handleCollectClick (t14)", () => {
    const cbs = buildHeroCallbacks("1292052");
    expect(() => cbs.handleCollectClick()).not.toThrow();
  });

  it("does not throw when calling handleOpenInterest (t15)", () => {
    stubRaf();
    const cbs = buildHeroCallbacks("1292052");
    expect(() => cbs.handleOpenInterest(defaultInterest)).not.toThrow();
  });

  it("handleOpenInterest creates interest modal in the DOM (t16)", () => {
    stubRaf();
    const cbs = buildHeroCallbacks("1292052");
    cbs.handleOpenInterest(defaultInterest);
    const modal = document.querySelector("#atv-interest-modal");
    expect(modal).not.toBeNull();
    expect(modal).toBeInstanceOf(HTMLElement);
  });

  it("handleOpenInterest renders a single close button inside the modal header (t16b)", () => {
    stubRaf();
    const cbs = buildHeroCallbacks("1292052");
    cbs.handleOpenInterest(defaultInterest);

    const modal = document.querySelector("#atv-interest-modal") as HTMLElement;
    const closeButtons = modal.querySelectorAll(
      ".atv-interest-modal-close, .atv-modal-close"
    );
    expect(closeButtons).toHaveLength(1);
    expect(
      modal.querySelector(
        ".atv-interest-modal-header > .atv-interest-modal-close"
      )
    ).not.toBeNull();
  });

  it("handleOpenInterest removes existing modal before creating new one (t17)", () => {
    stubRaf();
    const cbs = buildHeroCallbacks("1292052");

    // First call creates modal
    cbs.handleOpenInterest(defaultInterest);
    const firstModal = document.querySelector("#atv-interest-modal");
    expect(firstModal).not.toBeNull();

    // Second call removes old and creates new
    cbs.handleOpenInterest(defaultInterest);
    const modals = document.querySelectorAll("#atv-interest-modal");
    // After second call, only one modal should be in the DOM
    expect(modals).toHaveLength(1);
  });

  it("handleOpenInterest renders expected title for unmarked state (t18)", () => {
    stubRaf();
    const cbs = buildHeroCallbacks("1292052");
    const unmarked: InterestState = {
      ...defaultInterest,
      marked: false,
      status: "none",
    };
    cbs.handleOpenInterest(unmarked);

    const modal = document.querySelector("#atv-interest-modal");
    expect(modal).not.toBeNull();

    const titleEl = modal?.querySelector(
      ".atv-interest-modal-header__title"
    ) as HTMLElement;
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("标记想看");
  });

  it("handleOpenInterest renders expected title for collect state (t19)", () => {
    stubRaf();
    const cbs = buildHeroCallbacks("1292052");
    const collected: InterestState = {
      ...defaultInterest,
      loggedIn: true,
      marked: true,
      rating: 4,
      status: "collect",
    };
    cbs.handleOpenInterest(collected);

    const modal = document.querySelector("#atv-interest-modal");
    expect(modal).not.toBeNull();

    const titleEl = modal?.querySelector(
      ".atv-interest-modal-header__title"
    ) as HTMLElement;
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("修改看过");
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* ── watchSeries ──────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe(watchSeries, () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("builds series section when .items-swiper appears late in #series-items (t20)", async () => {
    document.body.innerHTML = `
      <div id="series-items"></div>
      <div id="atv-douban-root">
        <section class="atv-hero-section"></section>
        <div class="atv-footer-spacer"></div>
      </div>
      <nav class="atv-stickynav">
        <div class="atv-stickynav-title">Title</div>
        <div class="atv-stickynav-jumps"></div>
      </nav>
    `;

    const root = document.querySelector("#atv-douban-root") as HTMLElement;
    const nav = document.querySelector(".atv-stickynav") as HTMLElement;

    watchSeries(root, nav);

    const container = document.querySelector("#series-items") as HTMLElement;
    container.innerHTML = `
      <div class="items-swiper">
        <div class="items-swiper-item">
          <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img1.doubanio.com/poster1.jpg"></a></div>
          <div class="items-swiper-item-title" title="第一季"><a href="https://movie.douban.com/subject/1/">第一季</a><span class="items-swiper-item-rating">9.5</span></div>
        </div>
        <div class="items-swiper-item">
          <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/2/"><img src="https://img1.doubanio.com/poster2.jpg"></a></div>
          <div class="items-swiper-item-title" title="第二季"><a href="https://movie.douban.com/subject/2/">第二季</a><span class="items-swiper-item-rating">9.3</span></div>
        </div>
      </div>
    `;

    await vi.waitFor(() => {
      expect(root.querySelector("#atv-series")).not.toBeNull();
    });

    const seriesSection = root.querySelector("#atv-series") as HTMLElement;
    expect(seriesSection.classList.contains("atv-section")).toBeTruthy();

    const cards = root.querySelectorAll(".atv-series-card");
    expect(cards).toHaveLength(2);

    const navLink = nav.querySelector('a[href="#atv-series"]');
    expect(navLink).not.toBeNull();
    expect(navLink?.textContent).toBe("同系列");
  });

  it("does not set up observer when .items-swiper already exists (t21)", () => {
    document.body.innerHTML = `
      <div id="series-items">
        <div class="items-swiper"><div class="items-swiper-item"></div></div>
      </div>
      <div id="atv-douban-root">
        <section class="atv-hero-section"></section>
      </div>
      <nav class="atv-stickynav">
        <div class="atv-stickynav-jumps"></div>
      </nav>
    `;

    const root = document.querySelector("#atv-douban-root") as HTMLElement;
    const nav = document.querySelector(".atv-stickynav") as HTMLElement;

    const spy = vi.spyOn(window, "MutationObserver");
    watchSeries(root, nav);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does nothing when #series-items is absent from page (t22)", () => {
    document.body.innerHTML = `
      <div id="atv-douban-root">
        <section class="atv-hero-section"></section>
      </div>
      <nav class="atv-stickynav">
        <div class="atv-stickynav-jumps"></div>
      </nav>
    `;

    const root = document.querySelector("#atv-douban-root") as HTMLElement;
    const nav = document.querySelector(".atv-stickynav") as HTMLElement;

    const spy = vi.spyOn(window, "MutationObserver");
    watchSeries(root, nav);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
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
});
