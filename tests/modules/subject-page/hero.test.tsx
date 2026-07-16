import { setTimeout as delay } from "node:timers/promises";

import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Hero } from "@/modules/subject-page/hero";
import { HeroActions } from "@/modules/subject-page/hero/hero-actions";
import {
  HeroBackground,
  pickStill,
} from "@/modules/subject-page/hero/hero-background";
import { HeroSummary } from "@/modules/subject-page/hero/hero-summary";
import type { HeroCallbacks, HeroData, InterestState, Photo } from "@/types";

import { renderSingle } from "../../helpers/render";

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
  rankLabel: null,
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
  handleOpenInterest: vi.fn<(interest: InterestState) => void>(),
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

  it("renders a runtime-supplied first-broadcast attribution", () => {
    const el = renderSingle(
      <Hero
        callbacks={makeCallbacks()}
        data={makeHeroData()}
        firstBroadcastPlatform="Apple TV+"
      />
    );

    expect(
      el.querySelector(".atv-hero-meta .atv-first-broadcast-platform")
    ).not.toBeNull();
  });

  it("renders a linked Douban collection rank when available", () => {
    const el = renderSingle(
      <Hero
        callbacks={makeCallbacks()}
        data={makeHeroData({
          rankLabel: {
            href: "https://m.douban.com/subject_collection/ECVACWVGI",
            position: "No.12",
            title: "高分经典美剧榜",
          },
        })}
      />
    );

    const rank = el.querySelector<HTMLAnchorElement>(".atv-rank-label");
    expect(rank?.textContent).toBe("No.12高分经典美剧榜");
    expect(rank?.href).toBe(
      "https://m.douban.com/subject_collection/ECVACWVGI"
    );
    expect(rank?.target).toBe("_blank");
    expect(rank?.getAttribute("aria-label")).toBe(
      "查看榜单：高分经典美剧榜，No.12"
    );
    expect(rank?.querySelector(".atv-rank-label-entry")).not.toBeNull();
  });

  it("routes logged-out actions to the interest callback with an action label", () => {
    const callbacks = makeCallbacks();
    const el = renderSingle(
      <Hero callbacks={callbacks} data={makeHeroData()} />
    );
    const buttons = el.querySelectorAll<HTMLButtonElement>(
      ".atv-actions button"
    );

    buttons[0]?.click();
    buttons[1]?.click();

    expect(callbacks.handleOpenInterest).toHaveBeenNthCalledWith(
      1,
      defaultInterest,
      "标记想看"
    );
    expect(callbacks.handleOpenInterest).toHaveBeenNthCalledWith(
      2,
      defaultInterest,
      "标记看过"
    );
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

  it("replaces first-mark actions with the saved interest panel", async () => {
    const callbacks = makeCallbacks();
    const root = document.createElement("div");
    const unmarkedInterest = { ...defaultInterest, loggedIn: true };
    const markedInterest = {
      ...unmarkedInterest,
      comment: "年度最佳",
      marked: true,
      rating: 4,
      status: "collect" as const,
    };

    render(
      <HeroActions callbacks={callbacks} state={unmarkedInterest} />,
      root
    );
    expect(root.querySelector(".atv-interest-panel")).toBeNull();

    render(<HeroActions callbacks={callbacks} state={markedInterest} />, root);
    await Promise.resolve();

    expect(root.querySelector(".atv-interest-panel")).not.toBeNull();
    expect(root.querySelectorAll(".atv-actions > .atv-btn")).toHaveLength(0);
    expect(root.querySelector(".atv-interest-badge")?.textContent).toContain(
      "看过"
    );
    expect(root.querySelector(".atv-interest-panel-comment")?.textContent).toBe(
      '"年度最佳"'
    );
  });
});

describe(HeroSummary, () => {
  it("removes the clamp when the visual summary expands", async () => {
    const el = renderSingle(<HeroSummary text="截断的简介" />);

    el.querySelector<HTMLButtonElement>(".atv-hero-more")?.click();
    await Promise.resolve();
    expect(el.querySelector(".atv-hero-teaser")?.classList).not.toContain(
      "is-clamped"
    );
  });

  it("keeps the teaser content mounted across reversible expand and collapse", async () => {
    const el = renderSingle(<HeroSummary text="截断的简介" />);
    const content = el.querySelector(".atv-hero-teaser-content");

    el.querySelector<HTMLButtonElement>(".atv-hero-more")?.click();
    await Promise.resolve();
    expect(el.querySelector(".atv-hero-teaser-content")).toBe(content);

    el.querySelector<HTMLButtonElement>(".atv-hero-more")?.click();
    await Promise.resolve();
    expect(el.querySelector(".atv-hero-teaser-content")).toBe(content);
  });
});
