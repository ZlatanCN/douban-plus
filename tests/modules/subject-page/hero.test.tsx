import { setTimeout as delay } from "node:timers/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import { Hero } from "@/modules/subject-page/hero";
import {
  HeroBackground,
  pickStill,
} from "@/modules/subject-page/hero/hero-background";
import { HeroSummary } from "@/modules/subject-page/hero/hero-summary";
import type { HeroCallbacks, HeroData, InterestState, Photo } from "@/types";

import { renderSingle } from "../../helpers/render";

const mockRequest = vi.hoisted(() =>
  vi.fn<(url: string, ...args: unknown[]) => Promise<string>>()
);

vi.mock(import("../../../src/utils/request"), () => ({
  gmGet: mockRequest,
  gmPost: mockRequest,
}));

const makePhoto = (overrides?: Partial<Photo>): Photo => ({
  hdUrl: "https://example.com/hd.jpg",
  link: "https://example.com/link",
  thumbUrl: "https://example.com/thumb.jpg",
  ...overrides,
});

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
  imdbId: null,
  info: {
    country: "",
    episodeRuntime: "",
    episodes: "",
    genres: ["剧情", "犯罪"],
    runtime: "142分钟",
    seasons: "",
  },
  interest: { ...defaultInterest },
  isTV: false,
  photos: [],
  poster: null,
  rating: { count: 2_000_000, score: 9.7 },
  subjectId: "1292052",
  summary: "Hope can set you free.",
  title: {
    full: "肖申克的救赎 / The Shawshank Redemption",
    original: "The Shawshank Redemption",
    primary: "肖申克的救赎",
  },
  year: "1994",
  ...overrides,
});

const makeCallbacks = (): HeroCallbacks => ({
  handleCollectClick: vi.fn<() => void>(),
  handleOpenInterest: vi.fn<(interest: InterestState) => void>(),
  handleWatchingClick: vi.fn<() => void>(),
  handleWishClick: vi.fn<() => void>(),
});

const imageInstances: HTMLImageElement[] = [];

const waitUntil = async (assertion: () => void): Promise<void> => {
  // oxlint-disable-next-line no-unreachable-loop -- assertion throws on failure, caught below, loop continues
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      if (attempt === 19) {
        throw error;
      }
      // eslint-disable-next-line no-await-in-loop -- this helper intentionally polls sequentially.
      await delay(5);
    }
  }
};

const stubImage = (): void => {
  const OriginalImage = window.Image;
  imageInstances.length = 0;
  vi.stubGlobal(
    "Image",
    class MockImage extends OriginalImage {
      constructor(width?: number, height?: number) {
        super(width, height);
        imageInstances.push(this);
      }
    }
  );
};

describe(HeroBackground, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    imageInstances.length = 0;
  });
  it("picks a deterministic still from the provided photos", () => {
    const photos = [
      makePhoto({ thumbUrl: "a.jpg" }),
      makePhoto({ thumbUrl: "b.jpg" }),
      makePhoto({ thumbUrl: "c.jpg" }),
    ];

    expect(pickStill([], "seed")).toBeNull();
    expect(pickStill(photos, "abc")).toBe(pickStill(photos, "abc"));
    expect(photos).toContain(pickStill(photos, "xyz"));
  });

  it("renders thumb and HD layers for stills", () => {
    const el = renderSingle(
      <HeroBackground
        photos={[makePhoto({ hdUrl: "https://example.com/hd-bg.jpg" })]}
        poster={null}
        subjectId="1292052"
      />
    );

    expect(el.className).toBe("atv-hero-bg");
    expect(
      (el.querySelector(".is-thumb") as HTMLElement).style.backgroundImage
    ).toContain("example.com/thumb.jpg");
    expect(el.querySelector(".is-hd")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });

  it("marks the HD layer loaded after image load", async () => {
    stubImage();
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
    const el = renderSingle(
      <HeroBackground
        photos={[makePhoto({ hdUrl: "https://example.com/hd-bg.jpg" })]}
        poster={null}
        subjectId="1292052"
      />
    );
    await waitUntil(() => expect(imageInstances.length).toBeGreaterThan(0));

    for (const image of imageInstances) {
      image.dispatchEvent(new Event("load"));
    }
    await waitUntil(() =>
      expect(el.querySelector(".is-hd")?.classList).toContain("is-loaded")
    );

    const hd = el.querySelector(".is-hd") as HTMLElement;
    expect(hd.style.backgroundImage).toBe(
      'url("https://example.com/hd-bg.jpg")'
    );
  });

  it("falls back to poster or gradient when still is missing", () => {
    const poster = renderSingle(
      <HeroBackground
        photos={[]}
        poster="https://example.com/poster.jpg"
        subjectId="1292052"
      />
    );
    const gradient = renderSingle(
      <HeroBackground photos={[]} poster={null} subjectId="1292052" />
    );

    expect(
      (poster.querySelector(".is-poster") as HTMLElement).style.backgroundImage
    ).toContain("example.com/poster.jpg");
    expect((gradient as HTMLElement).style.background).toContain(
      "radial-gradient"
    );
  });
});

describe(Hero, () => {
  it("renders title, original title and metadata", () => {
    const el = renderSingle(
      <Hero callbacks={makeCallbacks()} data={makeHeroData()} />
    );

    expect(el.className).toBe("atv-hero");
    expect(el.querySelector(".atv-hero-title")?.textContent).toBe(
      "肖申克的救赎"
    );
    expect(el.querySelector(".atv-hero-orig")?.textContent).toBe(
      "The Shawshank Redemption"
    );
    expect(el.querySelector(".atv-hero-meta")?.textContent).toContain("1994");
    expect(el.querySelector(".atv-rating-panel-score")?.textContent).toBe(
      "9.7"
    );
  });

  it("renders actions and summary", () => {
    const el = renderSingle(
      <Hero callbacks={makeCallbacks()} data={makeHeroData()} />
    );

    expect(el.querySelector(".atv-actions")).not.toBeNull();
    expect(el.querySelector(".atv-hero-summary")?.textContent).toContain(
      "Hope can set you free."
    );
  });

  it("adds a first-broadcast attribution after the signed-in edit lookup", async () => {
    mockRequest.mockClear();
    mockRequest.mockResolvedValue(`
      <div class="item basic">
        <label for="p_142">电视台</label>
        <input id="p_142" value="Apple TV+" readonly />
      </div>
    `);
    const el = renderSingle(
      <Hero
        callbacks={makeCallbacks()}
        data={makeHeroData({
          interest: { ...defaultInterest, loggedIn: true },
          subjectId: "36858672",
        })}
      />
    );

    await waitUntil(() =>
      expect(
        el.querySelector(".atv-hero-meta .atv-first-broadcast-platform")
      ).not.toBeNull()
    );

    expect(mockRequest).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/36858672/edit",
      location.href
    );
  });

  it("does not request first-broadcast data for logged-out viewers", async () => {
    mockRequest.mockClear();
    renderSingle(<Hero callbacks={makeCallbacks()} data={makeHeroData()} />);

    await Promise.resolve();

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("reuses a first-broadcast lookup across a same-page Hero remount", async () => {
    mockRequest.mockClear();
    mockRequest.mockResolvedValue(`
      <div class="item basic">
        <label for="p_142">电视台</label>
        <input id="p_142" value="HBO/HBO Max" readonly />
      </div>
    `);
    const data = makeHeroData({
      interest: { ...defaultInterest, loggedIn: true },
      subjectId: "36666949",
    });

    const first = renderSingle(
      <Hero callbacks={makeCallbacks()} data={data} />
    );
    await waitUntil(() =>
      expect(
        first.querySelector(".atv-first-broadcast-platform")
      ).not.toBeNull()
    );

    const second = renderSingle(
      <Hero callbacks={makeCallbacks()} data={data} />
    );
    await waitUntil(() =>
      expect(
        second.querySelector(".atv-first-broadcast-platform")
      ).not.toBeNull()
    );

    expect(mockRequest).toHaveBeenCalledOnce();
  });

  it("routes logged-out actions to the login-gated callbacks", () => {
    const callbacks = makeCallbacks();
    const el = renderSingle(
      <Hero callbacks={callbacks} data={makeHeroData()} />
    );
    const buttons = el.querySelectorAll<HTMLButtonElement>(
      ".atv-actions button"
    );

    buttons[0]?.click();
    buttons[1]?.click();

    expect(callbacks.handleWishClick).toHaveBeenCalledOnce();
    expect(callbacks.handleCollectClick).toHaveBeenCalledOnce();
    expect(callbacks.handleOpenInterest).not.toHaveBeenCalled();
  });

  it("renders marked interest state and opens the interest modal callback", () => {
    const callbacks = makeCallbacks();
    const interest = {
      ...defaultInterest,
      comment: "年度最佳",
      date: "2026-07-08",
      loggedIn: true,
      marked: true,
      rating: 4,
      status: "collect" as const,
      usefulCount: "12 有用",
    };
    const el = renderSingle(
      <Hero callbacks={callbacks} data={makeHeroData({ interest })} />
    );

    expect(el.querySelector(".atv-interest-badge")?.textContent).toContain(
      "看过"
    );
    expect(
      el.querySelector(".atv-interest-panel-comment")?.textContent
    ).toContain("年度最佳");
    el.querySelector<HTMLButtonElement>(".atv-interest-badge")?.click();
    expect(callbacks.handleOpenInterest).toHaveBeenCalledWith(interest);
  });
});

describe(HeroSummary, () => {
  it("replaces the teaser with the native expanded summary", async () => {
    const expandNativeSummary = vi
      .fn<() => Promise<string>>()
      .mockResolvedValue("完整的豆瓣剧情简介");
    const el = renderSingle(
      <HeroSummary
        expandNativeSummary={expandNativeSummary}
        text="截断的简介"
      />
    );

    el.querySelector<HTMLButtonElement>(".atv-hero-more")?.click();
    await waitUntil(() =>
      expect(el.querySelector(".atv-hero-teaser")?.textContent).toBe(
        "完整的豆瓣剧情简介"
      )
    );

    expect(expandNativeSummary).toHaveBeenCalledOnce();
  });

  it("removes the clamp before an asynchronous native response resolves", async () => {
    const el = renderSingle(
      <HeroSummary
        expandNativeSummary={() =>
          // eslint-disable-next-line promise/avoid-new -- Models an in-flight native DOM expansion without resolving it.
          new Promise<string>((resolve) => {
            void resolve;
          })
        }
        text="截断的简介"
      />
    );

    el.querySelector<HTMLButtonElement>(".atv-hero-more")?.click();
    await Promise.resolve();
    expect(el.querySelector(".atv-hero-teaser")?.classList).not.toContain(
      "is-clamped"
    );
  });
});
