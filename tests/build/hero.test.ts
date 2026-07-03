/* ── buildHero — Unit Tests ────────────────────────────────── */
/* Tests pickStill(), buildHeroBg(), and buildHero() from       */
/* src/build/hero.ts.                                           */

import { setTimeout as delay } from "node:timers/promises";

import { describe, it, expect, vi, afterEach } from "vitest";

import { buildHero, buildHeroBg, pickStill } from "../../src/build/hero";
import type { HeroCallbacks, HeroData, Photo } from "../../src/types";

/* ── Helpers ───────────────────────────────────────────────── */

const makePhoto = (overrides?: Partial<Photo>): Photo => ({
  hdUrl: "https://example.com/hd.jpg",
  link: "https://example.com/link",
  thumbUrl: "https://example.com/thumb.jpg",
  ...overrides,
});

const defaultInfo = {
  country: "",
  episodeRuntime: "",
  episodes: "",
  genres: [] as string[],
  runtime: "",
  seasons: "",
};

const defaultInterest = {
  ck: "",
  comment: "",
  date: "",
  hasWatching: false,
  loggedIn: false,
  marked: false,
  rating: 0,
  status: "none" as const,
  tags: [] as string[],
  usefulCount: "",
};

const makeHeroData = (overrides?: Partial<HeroData>): HeroData => ({
  info: { ...defaultInfo },
  interest: { ...defaultInterest },
  isTV: false,
  photos: [],
  poster: null,
  rating: null,
  subjectId: "1292052",
  summary: null,
  title: {
    full: "The Shawshank Redemption",
    original: "",
    primary: "肖申克的救赎",
  },
  year: "1994",
  ...overrides,
});

const makeCallbacks = (): HeroCallbacks => ({
  onCollectClick: vi.fn(),
  onOpenInterest: vi.fn(),
  onWatchingClick: vi.fn(),
  onWishClick: vi.fn(),
});

/* ── Cleanup for async Image mock tests ──────────────────── */

const imageInstances: HTMLImageElement[] = [];
let origImage: typeof window.Image | null = null;

const stubImage = (): void => {
  origImage = window.Image;
  imageInstances.length = 0;
  vi.stubGlobal(
    "Image",
    class MockImage extends (origImage as typeof window.Image) {
      constructor(width?: number, height?: number) {
        super(width, height);
        imageInstances.push(this);
      }
    }
  );
};

const unstubImage = (): void => {
  vi.unstubAllGlobals();
  imageInstances.length = 0;
};

/* ═══════════════════════════════════════════════════════════ */
/* ── pickStill ──────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("pickStill", () => {
  it("returns null for empty photos array (t1)", () => {
    expect(pickStill([], "seed")).toBeNull();
  });

  it("returns null for null/undefined photos (t2)", () => {
    expect(pickStill(null as unknown as Photo[], "seed")).toBeNull();
    expect(pickStill(undefined as unknown as Photo[], "seed")).toBeNull();
  });

  it("returns a Photo object from valid array (t3)", () => {
    const photos = [makePhoto({ thumbUrl: "https://example.com/t.jpg" })];
    const result = pickStill(photos, "seed");
    expect(result).not.toBeNull();
    expect(result?.thumbUrl).toBe("https://example.com/t.jpg");
  });

  it("is deterministic: same seed returns same result (t4)", () => {
    const photos = [
      makePhoto({ thumbUrl: "a.jpg" }),
      makePhoto({ thumbUrl: "b.jpg" }),
      makePhoto({ thumbUrl: "c.jpg" }),
    ];
    expect(pickStill(photos, "abc")).toBe(pickStill(photos, "abc"));
  });

  it("may return different results for different seeds (t5)", () => {
    const photos = Array.from({ length: 10 }, (_, i) =>
      makePhoto({ thumbUrl: `${i}.jpg` })
    );
    const a = pickStill(photos, "abc");
    const b = pickStill(photos, "xyz");
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // Both should be valid Photo objects from the array
    expect(photos).toContain(a);
    expect(photos).toContain(b);
  });

  it("single-element array returns that element (t6)", () => {
    const photo = makePhoto({ thumbUrl: "only.jpg" });
    expect(pickStill([photo], "any-seed")).toBe(photo);
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* ── buildHeroBg ────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("buildHeroBg", () => {
  it("creates a div.atv-hero-bg container (t7)", () => {
    const bg = buildHeroBg(makeHeroData());
    expect(bg.tagName).toBe("DIV");
    expect(bg.className).toBe("atv-hero-bg");
  });

  it("renders .is-thumb + .is-hd children when photo has hdUrl (t8)", () => {
    const data = makeHeroData({
      photos: [makePhoto({ hdUrl: "https://example.com/hd.jpg" })],
    });
    const bg = buildHeroBg(data);

    const thumb = bg.querySelector(".is-thumb") as HTMLElement;
    const hd = bg.querySelector(".is-hd") as HTMLElement;

    expect(thumb).not.toBeNull();
    expect(hd).not.toBeNull();
    expect(thumb.style.backgroundImage).toContain("example.com/thumb.jpg");
    expect(hd.getAttribute("aria-hidden")).toBe("true");
  });

  it("uses thumbUrl for thumb, falls back to hdUrl when thumbUrl empty (t9)", () => {
    const data = makeHeroData({
      photos: [
        makePhoto({
          hdUrl: "https://example.com/hd-fallback.jpg",
          thumbUrl: "",
        }),
      ],
    });
    const bg = buildHeroBg(data);
    const thumb = bg.querySelector(".is-thumb") as HTMLElement;
    expect(thumb.style.backgroundImage).toContain(
      "example.com/hd-fallback.jpg"
    );
  });

  it("renders .is-poster when no photo has hdUrl but poster is present (t10)", () => {
    const data = makeHeroData({
      photos: [],
      poster: "https://example.com/poster.jpg",
    });
    const bg = buildHeroBg(data);
    const poster = bg.querySelector(".is-poster") as HTMLElement;
    expect(poster).not.toBeNull();
    expect(poster.style.backgroundImage).toContain("example.com/poster.jpg");
  });

  it("renders gradient when no still and no poster (t11)", () => {
    const data = makeHeroData({ photos: [], poster: null });
    const bg = buildHeroBg(data);
    expect(bg.style.background).toContain("radial-gradient");
  });

  it("renders gradient fallback when photos array is empty (pickStill returns null) (t12)", () => {
    const data = makeHeroData({ photos: [], poster: null });
    const bg = buildHeroBg(data);
    expect(bg.style.background).toContain("radial-gradient");
    expect(bg.querySelector(".atv-hero-still")).toBeNull();
  });
});

/* ── buildHeroBg — async HD image loading ──────────────────── */

describe("buildHeroBg - async HD loading", () => {
  afterEach(() => {
    unstubImage();
  });

  it("sets HD background and is-loaded class after image load (t13)", async () => {
    stubImage();

    const data = makeHeroData({
      photos: [
        makePhoto({
          hdUrl: "https://example.com/hd-bg.jpg",
          thumbUrl: "https://example.com/thumb-bg.jpg",
        }),
      ],
    });
    const bg = buildHeroBg(data);
    const hd = bg.querySelector(".is-hd") as HTMLElement;

    // Before load: HD div exists but not yet filled
    expect(hd.style.backgroundImage).toBe("");
    expect(hd.classList.contains("is-loaded")).toBe(false);

    // Simulate successful image load
    imageInstances[0]?.dispatchEvent(new Event("load"));

    // Yield to let requestAnimationFrame (setTimeout wrapper) fire
    await delay(5);

    expect(hd.style.backgroundImage).toBe(
      'url("https://example.com/hd-bg.jpg")'
    );
    expect(hd.classList.contains("is-loaded")).toBe(true);
  });

  it("falls back to thumbUrl when HD image errors and thumb differs from hd (t14)", async () => {
    stubImage();

    const data = makeHeroData({
      photos: [
        makePhoto({
          hdUrl: "https://example.com/fail.jpg",
          thumbUrl: "https://example.com/thumb-fallback.jpg",
        }),
      ],
    });
    const bg = buildHeroBg(data);
    const hd = bg.querySelector(".is-hd") as HTMLElement;

    // Simulate load error
    imageInstances[0]?.dispatchEvent(new Event("error"));

    await delay(5);

    expect(hd.style.backgroundImage).toBe(
      'url("https://example.com/thumb-fallback.jpg")'
    );
    expect(hd.classList.contains("is-loaded")).toBe(true);
  });

  it("does not set fallback when hdUrl and thumbUrl are identical on error (t15)", async () => {
    stubImage();

    const data = makeHeroData({
      photos: [
        makePhoto({
          hdUrl: "https://example.com/same.jpg",
          thumbUrl: "https://example.com/same.jpg",
        }),
      ],
    });
    const bg = buildHeroBg(data);
    const hd = bg.querySelector(".is-hd") as HTMLElement;

    imageInstances[0]?.dispatchEvent(new Event("error"));

    await delay(5);

    expect(hd.style.backgroundImage).toBe("");
    expect(hd.classList.contains("is-loaded")).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════ */
/* ── buildHero ──────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

describe("buildHero", () => {
  it("returns a section element with class atv-hero (t16)", () => {
    const hero = buildHero(makeHeroData(), makeCallbacks());
    expect(hero.tagName).toBe("SECTION");
    expect(hero.classList.contains("atv-hero")).toBe(true);
  });

  it("contains 5 direct children: bg, vignette, overlay-x, overlay-y, inner-section (t17)", () => {
    const hero = buildHero(makeHeroData(), makeCallbacks());
    expect(hero.children).toHaveLength(5);
    expect(hero.children[0]).not.toBeNull();
    expect(hero.children[1]?.className).toBe("atv-hero-vignette");
    expect(hero.children[2]?.className).toBe("atv-hero-overlay-x");
    expect(hero.children[3]?.className).toBe("atv-hero-overlay-y");
    expect(hero.children[4]?.className).toBe("atv-hero-inner-section");
  });

  /* ── Title ────────────────────────────────────────────── */

  it("renders title from data.title.primary in h1.atv-hero-title (t18)", () => {
    const hero = buildHero(
      makeHeroData({
        title: {
          full: "Full Title",
          original: "",
          primary: "Primary Title",
        },
      }),
      makeCallbacks()
    );
    const title = hero.querySelector(".atv-hero-title") as HTMLElement;
    expect(title).not.toBeNull();
    expect(title?.textContent).toBe("Primary Title");
  });

  it("falls back to data.title.full when primary is empty (t19)", () => {
    const hero = buildHero(
      makeHeroData({
        title: {
          full: "The Shawshank Redemption",
          original: "",
          primary: "",
        },
      }),
      makeCallbacks()
    );
    const title = hero.querySelector(".atv-hero-title") as HTMLElement;
    expect(title?.textContent).toBe("The Shawshank Redemption");
  });

  /* ── Original title ──────────────────────────────────── */

  it("renders original title in .atv-hero-orig when present (t20)", () => {
    const hero = buildHero(
      makeHeroData({
        title: {
          full: "Test",
          original: "The Shawshank Redemption",
          primary: "测试",
        },
      }),
      makeCallbacks()
    );
    const orig = hero.querySelector(".atv-hero-orig") as HTMLElement;
    expect(orig).not.toBeNull();
    expect(orig?.textContent).toBe("The Shawshank Redemption");
  });

  it("omits .atv-hero-orig when original is empty (t21)", () => {
    const hero = buildHero(
      makeHeroData({
        title: { full: "Test", original: "", primary: "测试" },
      }),
      makeCallbacks()
    );
    expect(hero.querySelector(".atv-hero-orig")).toBeNull();
  });

  /* ── Meta ────────────────────────────────────────────────── */

  it("renders year in .atv-meta-dot span (t22)", () => {
    const hero = buildHero(makeHeroData({ year: "1994" }), makeCallbacks());
    const metaDots = hero.querySelectorAll(".atv-meta-dot");
    const yearDot = [...metaDots].find((d) => d.textContent === "1994");
    expect(yearDot).not.toBeNull();
  });

  it("renders genre chips in .atv-meta-chips for genres in info (t23)", () => {
    const hero = buildHero(
      makeHeroData({
        info: { ...defaultInfo, genres: ["剧情", "犯罪"] },
      }),
      makeCallbacks()
    );
    const chips = hero.querySelectorAll(".atv-chip");
    expect(chips).toHaveLength(2);
    expect(chips[0]?.textContent).toBe("剧情");
    expect(chips[1]?.textContent).toBe("犯罪");
  });

  it("renders country in meta (t24)", () => {
    const hero = buildHero(
      makeHeroData({
        info: { ...defaultInfo, country: "美国" },
        year: "1994",
      }),
      makeCallbacks()
    );
    const metaDots = hero.querySelectorAll(".atv-meta-dot");
    const countryDot = [...metaDots].find((d) => d.textContent === "美国");
    expect(countryDot).not.toBeNull();
  });

  it("renders runtime for non-TV (isTV=false) (t25)", () => {
    const hero = buildHero(
      makeHeroData({
        info: { ...defaultInfo, runtime: "142分钟" },
        isTV: false,
        year: "1994",
      }),
      makeCallbacks()
    );
    const metaDots = hero.querySelectorAll(".atv-meta-dot");
    const runtimeDot = [...metaDots].find((d) => d.textContent === "142分钟");
    expect(runtimeDot).not.toBeNull();
  });

  it("renders season and episode info for TV (isTV=true) (t26)", () => {
    const hero = buildHero(
      makeHeroData({
        info: {
          ...defaultInfo,
          country: "美国",
          episodes: "73",
          seasons: "8",
        },
        isTV: true,
        year: "2011",
      }),
      makeCallbacks()
    );
    const metaDots = hero.querySelectorAll(".atv-meta-dot");
    const segText = [...metaDots].map((d) => d.textContent).filter(Boolean);
    // Should contain "8季 · 73集" or the seg text
    const hasSeasonEpisode = segText.some(
      (t) => t?.includes("8") && t?.includes("73")
    );
    expect(hasSeasonEpisode).toBe(true);
  });

  /* ── Rating ──────────────────────────────────────────────── */

  it("renders rating row with score and stars when rating present (t27)", () => {
    const hero = buildHero(
      makeHeroData({ rating: { count: 1_234_567, score: 8.5 } }),
      makeCallbacks()
    );
    const row = hero.querySelector(".atv-rating-row") as HTMLElement;
    expect(row).not.toBeNull();

    const score = row?.querySelector(".atv-rating-score") as HTMLElement;
    expect(score).not.toBeNull();
    expect(score?.textContent).toBe("8.5");

    const stars = row?.querySelector(".atv-rating-stars") as HTMLElement;
    expect(stars).not.toBeNull();

    const count = row?.querySelector(".atv-rating-count") as HTMLElement;
    expect(count).not.toBeNull();
    expect(count?.textContent).toBe("评价 1,234,567");
  });

  it("shows '暂无评分' when rating is null (t28)", () => {
    const hero = buildHero(makeHeroData({ rating: null }), makeCallbacks());
    const empty = hero.querySelector(".atv-rating-empty") as HTMLElement;
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe("暂无评分");
  });

  /* ── Summary ─────────────────────────────────────────────── */

  it("renders summary section when summary is provided (t29)", () => {
    const hero = buildHero(
      makeHeroData({ summary: "A man seeking redemption..." }),
      makeCallbacks()
    );
    const summary = hero.querySelector(".atv-hero-summary") as HTMLElement;
    expect(summary).not.toBeNull();

    const teaser = summary?.querySelector(".atv-hero-teaser") as HTMLElement;
    expect(teaser).not.toBeNull();
    expect(teaser?.textContent).toBe("A man seeking redemption...");
    expect(teaser?.classList.contains("is-clamped")).toBe(true);

    const more = summary?.querySelector(".atv-hero-more") as HTMLElement;
    expect(more).not.toBeNull();
  });

  it("omits summary section when summary is null (t30)", () => {
    const hero = buildHero(makeHeroData({ summary: null }), makeCallbacks());
    expect(hero.querySelector(".atv-hero-summary")).toBeNull();
  });

  it("omits summary section when summary is empty string (t31)", () => {
    const hero = buildHero(makeHeroData({ summary: "" }), makeCallbacks());
    expect(hero.querySelector(".atv-hero-summary")).toBeNull();
  });

  /* ── Interest actions ────────────────────────────────────── */

  it("renders wish + collect buttons when user is not logged in (t32)", () => {
    const callbacks = makeCallbacks();
    const hero = buildHero(
      makeHeroData({
        interest: { ...defaultInterest, loggedIn: false },
      }),
      callbacks
    );
    const actions = hero.querySelector(".atv-actions") as HTMLElement;
    expect(actions).not.toBeNull();

    const btns = actions?.querySelectorAll("button");
    // "想看" + "看过" = 2
    expect(btns).toHaveLength(2);

    // Triggers correct callbacks on click
    (btns?.[0] as HTMLButtonElement)?.click();
    expect(callbacks.onWishClick).toHaveBeenCalledTimes(1);

    (btns?.[1] as HTMLButtonElement)?.click();
    expect(callbacks.onCollectClick).toHaveBeenCalledTimes(1);
  });

  it("renders watching button when hasWatching is true and not logged in (t33)", () => {
    const callbacks = makeCallbacks();
    const hero = buildHero(
      makeHeroData({
        interest: {
          ...defaultInterest,
          hasWatching: true,
          loggedIn: false,
        },
      }),
      callbacks
    );
    const btns = hero.querySelectorAll(".atv-actions button");
    // "想看" + "在看" + "看过" = 3
    expect(btns).toHaveLength(3);

    // The middle button is "在看"
    (btns[1] as HTMLButtonElement)?.click();
    expect(callbacks.onWatchingClick).toHaveBeenCalledTimes(1);
  });

  it("renders interest action buttons calling onOpenInterest when logged in and unmarked (t34)", () => {
    const callbacks = makeCallbacks();
    const hero = buildHero(
      makeHeroData({
        interest: {
          ...defaultInterest,
          loggedIn: true,
          marked: false,
        },
      }),
      callbacks
    );
    const btns = hero.querySelectorAll(".atv-actions button");
    expect(btns).toHaveLength(2);

    (btns[0] as HTMLButtonElement)?.click();
    expect(callbacks.onOpenInterest).toHaveBeenCalledTimes(1);

    (btns[1] as HTMLButtonElement)?.click();
    expect(callbacks.onOpenInterest).toHaveBeenCalledTimes(2);
  });

  it("renders interest panel with label when already marked (t35)", () => {
    const callbacks = makeCallbacks();
    const hero = buildHero(
      makeHeroData({
        interest: {
          ...defaultInterest,
          comment: "Great movie!",
          date: "2024-01-15",
          loggedIn: true,
          marked: true,
          rating: 4,
          status: "collect",
          usefulCount: "10有用",
        },
      }),
      callbacks
    );
    const panel = hero.querySelector(".atv-interest-panel") as HTMLElement;
    expect(panel).not.toBeNull();

    const badge = panel?.querySelector(".atv-interest-badge") as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("看过");

    // Should have stars for rating=4
    const stars = panel?.querySelector(
      ".atv-interest-panel-stars"
    ) as HTMLElement;
    expect(stars).not.toBeNull();

    // Should have date
    const date = panel?.querySelector(
      ".atv-interest-panel-date"
    ) as HTMLElement;
    expect(date).not.toBeNull();
    expect(date?.textContent).toBe("2024-01-15");

    // Should have comment
    const comment = panel?.querySelector(
      ".atv-interest-panel-comment"
    ) as HTMLElement;
    expect(comment).not.toBeNull();
    expect(comment?.textContent).toContain("Great movie!");
  });

  /* ── Poster card ─────────────────────────────────────────── */

  it("renders poster card with img when poster is provided (t36)", () => {
    const hero = buildHero(
      makeHeroData({
        poster: "https://example.com/poster.jpg",
        title: { full: "Test", original: "", primary: "Test" },
      }),
      makeCallbacks()
    );
    const card = hero.querySelector(".atv-poster-card") as HTMLElement;
    expect(card).not.toBeNull();

    const img = card?.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/poster.jpg");
    expect(img?.getAttribute("alt")).toBe("Test");
  });

  it("renders poster placeholder icon when poster is null (t37)", () => {
    const hero = buildHero(makeHeroData({ poster: null }), makeCallbacks());
    const placeholder = hero.querySelector(
      ".atv-poster-placeholder"
    ) as HTMLElement;
    expect(placeholder).not.toBeNull();
    // Should have SVG content
    expect(placeholder?.innerHTML).toContain("svg");
  });

  it("poster card click opens poster modal when poster is set (t38)", () => {
    const hero = buildHero(
      makeHeroData({
        poster: "https://example.com/poster.jpg",
        title: { full: "Test", original: "", primary: "Test Movie" },
      }),
      makeCallbacks()
    );

    const card = hero.querySelector(".atv-poster-card") as HTMLElement;
    expect(card).not.toBeNull();

    // Remove any leftover modal from previous test runs
    document.querySelector("#atv-poster-modal")?.remove();

    card?.click();

    const modal = document.querySelector("#atv-poster-modal") as HTMLElement;
    expect(modal).not.toBeNull();

    const img = modal?.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/poster.jpg");
    expect(img?.getAttribute("alt")).toBe("Test Movie");

    // Cleanup
    modal?.remove();
  });

  it("poster card click does not open modal when poster is null (t39)", () => {
    const hero = buildHero(makeHeroData({ poster: null }), makeCallbacks());

    document.querySelector("#atv-poster-modal")?.remove();

    const card = hero.querySelector(".atv-poster-card") as HTMLElement;
    card?.click();

    expect(document.querySelector("#atv-poster-modal")).toBeNull();
  });
});
