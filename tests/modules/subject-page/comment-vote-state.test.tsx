import { render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubjectPage } from "@/modules/subject-page/subject-page";
import type { SubjectPageRuntime } from "@/modules/subject-page/types";
import type { Comment, DoubanData, InfoBlock } from "@/types";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

const storeCommentVote = (
  key: string,
  value: unknown,
  expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000
): void => {
  localStorage.setItem(
    "atv:comment:vote",
    JSON.stringify([[key, { expiresAt, value }]])
  );
};

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

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  avatar: "",
  cid: "c1",
  content: "A short comment that can open from the expand button.",
  link: "",
  name: "TestUser",
  ratingWord: "",
  stars: 0,
  time: "2024-01-15",
  voted: false,
  votes: 5,
  ...overrides,
});

const makeData = (overrides?: Partial<DoubanData>): DoubanData => ({
  awards: [],
  celebrities: [],
  comments: [makeComment()],
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
  reviews: [],
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
  voteComment: SubjectPageRuntime["actions"]["handleCommentVote"] = () =>
    Promise.resolve({ ok: true }),
  resolvedComments: Comment[] = [makeComment()]
): SubjectPageRuntime => ({
  actions: {
    expandNativeSummary: () => Promise.resolve(null),
    handleCommentVote: voteComment,
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
    sections: [],
    visible: false,
  },
  resolvedComments,
  series: [],
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

const openCommentModal = async (root: HTMLElement): Promise<HTMLElement> => {
  root.querySelector<HTMLButtonElement>(".atv-comment-expand")?.click();
  await Promise.resolve();
  const modal = root.querySelector<HTMLElement>("#atv-comment-overlay");
  expect(modal).not.toBeNull();
  return modal as HTMLElement;
};

describe("comment vote state across cards and modals", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
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
      makeRuntime(() => Promise.resolve({ count: 9, ok: true }))
    );

    root.querySelector<HTMLButtonElement>(".atv-comment-votes")?.click();
    await Promise.resolve();
    await Promise.resolve();
    const modal = await openCommentModal(root);
    const modalVote = modal.querySelector<HTMLButtonElement>(
      ".atv-comment-overlay-votes"
    );

    expect(modalVote?.classList.contains("is-voted")).toBeTruthy();
    expect(modalVote?.getAttribute("aria-pressed")).toBe("true");
    expect(modalVote?.textContent).toContain("9");
  });

  it("shows modal vote state on the card after closing the modal", async () => {
    const root = renderPage(
      makeData(),
      makeRuntime(() => Promise.resolve({ count: 11, ok: true }))
    );
    const modal = await openCommentModal(root);

    modal
      .querySelector<HTMLButtonElement>(".atv-comment-overlay-votes")
      ?.click();
    await Promise.resolve();
    await Promise.resolve();
    modal.querySelector<HTMLButtonElement>(".atv-modal-close")?.click();
    await Promise.resolve();

    const cardVote =
      root.querySelector<HTMLButtonElement>(".atv-comment-votes");
    expect(cardVote?.classList.contains("is-voted")).toBeTruthy();
    expect(cardVote?.getAttribute("aria-pressed")).toBe("true");
    expect(cardVote?.textContent).toContain("11");
  });

  it("restores a previous comment vote after a page refresh", () => {
    storeCommentVote("c1", { count: 42, type: "up" });

    const root = renderPage();
    const cardVote =
      root.querySelector<HTMLButtonElement>(".atv-comment-votes");

    expect(cardVote?.classList.contains("is-voted")).toBeTruthy();
    expect(cardVote?.textContent).toContain("42");
  });

  it("persists the comment vote to localStorage on a successful vote", async () => {
    const root = renderPage(
      makeData(),
      makeRuntime(() => Promise.resolve({ count: 9, ok: true }))
    );

    root.querySelector<HTMLButtonElement>(".atv-comment-votes")?.click();
    await Promise.resolve();
    await Promise.resolve();

    const stored = JSON.parse(
      localStorage.getItem("atv:comment:vote") ?? "[]"
    ) as [
      string,
      { expiresAt: number; value: { count: number; type: string } },
    ][];
    expect(stored[0]?.[0]).toBe("c1");
    expect(stored[0]?.[1].value).toStrictEqual({ count: 9, type: "up" });
  });
});
