import { render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubjectPage } from "../../../src/modules/subject-page";
import type { SubjectPageDeps } from "../../../src/modules/subject-page";
import type { Comment, DoubanData, InfoBlock } from "../../../src/types";

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

const makeDeps = (overrides?: Partial<SubjectPageDeps>): SubjectPageDeps => ({
  canVote: () => true,
  handleVote: () => Promise.resolve({ ok: true }),
  heroCallbacks: {
    handleCollectClick: () => {},
    handleOpenInterest: () => {},
    handleWatchingClick: () => {},
    handleWishClick: () => {},
  },
  ...overrides,
});

const renderPage = (
  data: DoubanData = makeData(),
  deps: SubjectPageDeps = makeDeps()
): HTMLElement => {
  const root = document.createElement("div");
  root.id = "atv-douban-root";
  render(<SubjectPage data={data} deps={deps} />, root);
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
      makeDeps({
        handleVote: () => Promise.resolve({ count: 9, ok: true }),
      })
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
      makeDeps({
        handleVote: () => Promise.resolve({ count: 11, ok: true }),
      })
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
});
