import { render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubjectPage } from "@/modules/subject-page/subject-page";
import type { SubjectPageRuntime } from "@/modules/subject-page/types";
import type { DoubanData, InfoBlock, Review } from "@/types";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

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

const makeReview = (overrides?: Partial<Review>): Review => ({
  avatar: "",
  content: "A must-see classic.",
  id: "r1",
  link: "",
  name: "TestUser",
  ratingWord: "",
  spoiler: false,
  stars: 0,
  time: "2024-01-15",
  title: "Great movie with deep meaning",
  usefulCount: 5,
  uselessCount: 1,
  ...overrides,
});

const makeData = (overrides?: Partial<DoubanData>): DoubanData => ({
  awards: [],
  celebrities: [],
  comments: [],
  discussions: { topics: [] },
  info: makeInfoBlock(),
  interest: {
    ck: "",
    comment: "",
    date: "",
    hasWatching: false,
    loggedIn: true,
    marked: false,
    rating: 0,
    status: "none",
    tags: [],
    usefulCount: "",
  },
  isTV: false,
  photos: [],
  poster: null,
  rankLabel: null,
  rating: null,
  recommendations: [],
  reviews: [makeReview()],
  series: [],
  streaming: [],
  subjectId: "1292052",
  summary: "",
  title: { full: "Movie", original: "", primary: "Movie" },
  trailers: [],
  year: "",
  ...overrides,
});

const makeRuntime = (
  voteReview: SubjectPageRuntime["actions"]["handleReviewVote"] = () =>
    Promise.resolve({ ok: true })
): SubjectPageRuntime => ({
  actions: {
    handleCommentVote: () => Promise.resolve({ ok: true }),
    handleReviewVote: voteReview,
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
    sections: [],
    visible: false,
  },
  resolvedComments: [],
  series: [],
  summary: "",
});

const renderPage = (
  data: DoubanData = makeData(),
  runtime: SubjectPageRuntime = makeRuntime()
): HTMLElement => {
  const root = document.createElement("div");
  root.id = "atv-douban-root";
  render(<SubjectPage data={data} runtime={runtime} />, root);
  return root;
};

const openReviewModal = async (root: HTMLElement): Promise<HTMLElement> => {
  root.querySelector<HTMLButtonElement>(".atv-review-open-button")?.click();
  await Promise.resolve();
  const modal = root.querySelector<HTMLElement>("#atv-review-modal");
  expect(modal).not.toBeNull();
  return modal as HTMLElement;
};

const storeReviewVote = (
  key: string,
  value: unknown,
  expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000
): void => {
  localStorage.setItem(
    "atv:review:vote",
    JSON.stringify([[key, { expiresAt, value }]])
  );
};

describe("review vote state across cards and modals", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<never>>(() =>
        Promise.reject(new Error("network disabled in test"))
      )
    );
  });

  it("shows card vote state inside the modal after voting on a card", async () => {
    const root = renderPage(
      makeData(),
      makeRuntime(() =>
        Promise.resolve({ ok: true, usefulCount: 12, uselessCount: 1 })
      )
    );

    root
      .querySelector<HTMLButtonElement>(".atv-review-card .atv-vote-btn.up")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    const modal = await openReviewModal(root);

    const modalUp = modal.querySelector<HTMLButtonElement>(
      ".atv-review-modal-votes .atv-vote-btn.up"
    );
    expect(modalUp?.classList.contains("is-voted")).toBeTruthy();
    expect(modalUp?.textContent).toContain("12");
  });

  it("shows modal vote state on the card after closing the modal", async () => {
    const root = renderPage(
      makeData(),
      makeRuntime(() =>
        Promise.resolve({ ok: true, usefulCount: 5, uselessCount: 7 })
      )
    );
    const modal = await openReviewModal(root);

    modal
      .querySelector<HTMLButtonElement>(
        ".atv-review-modal-votes .atv-vote-btn.down"
      )
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    modal.querySelector<HTMLButtonElement>(".atv-modal-close")?.click();
    await Promise.resolve();

    const cardDown = root.querySelector<HTMLButtonElement>(
      ".atv-review-card .atv-vote-btn.down"
    );
    expect(cardDown?.classList.contains("is-voted")).toBeTruthy();
    expect(cardDown?.textContent).toContain("7");
  });

  it("restores previous vote state after a page refresh", () => {
    storeReviewVote("1", {
      type: "useful",
      usefulCount: 12,
      uselessCount: 1,
    });

    const root = renderPage();
    const up = root.querySelector<HTMLButtonElement>(
      ".atv-review-card .atv-vote-btn.up"
    );

    expect(up?.classList.contains("is-voted")).toBeTruthy();
    expect(up?.textContent).toContain("12");
  });
});
