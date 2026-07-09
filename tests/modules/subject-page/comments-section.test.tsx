import { render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommentsSection } from "@/modules/subject-page/comments";
import type { Comment, CommentsData } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  avatar: "",
  cid: "c1",
  content: "Great movie!",
  link: "",
  name: "TestUser",
  ratingWord: "",
  stars: 0,
  time: "2024-01-15",
  voted: false,
  votes: 5,
  ...overrides,
});

const makeData = (overrides?: Partial<CommentsData>): CommentsData => ({
  comments: [makeComment()],
  subjectId: "1292052",
  ...overrides,
});

const renderComments = (
  data = makeData(),
  options?: {
    canVote?: () => boolean;
    onOpen?: (comment: Comment) => void;
    onVote?: (cid: string) => Promise<{ count?: number; ok: boolean }>;
  }
) =>
  renderIntoRoot(
    <CommentsSection
      canVote={options?.canVote}
      comments={data.comments}
      onOpen={options?.onOpen ?? vi.fn<(comment: Comment) => void>()}
      onVote={options?.onVote ?? (() => Promise.resolve({ ok: true }))}
      subjectId={data.subjectId}
    />
  );

describe(CommentsSection, () => {
  beforeEach(() => {
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });
  it("renders nothing when comments are empty", () => {
    const root = renderComments(makeData({ comments: [] }));

    expect(root.firstElementChild).toBeNull();
  });

  it("renders section, cards and author details", () => {
    const root = renderComments(
      makeData({
        comments: [
          makeComment({
            avatar: "https://example.com/avatar.jpg",
            cid: "c123",
            link: "https://douban.com/people/u1/",
            name: "Alice",
            stars: 4,
            votes: 42,
          }),
        ],
      })
    );
    const section = root.querySelector<HTMLElement>("#atv-comments");
    const card = root.querySelector<HTMLElement>(".atv-comment-card");
    const author = root.querySelector<HTMLAnchorElement>(".atv-comment-author");

    expect(section?.tagName).toBe("SECTION");
    expect(section?.querySelector("h2")?.textContent).toBe("热门短评");
    expect(card?.dataset.cid).toBe("c123");
    expect(author?.href).toBe("https://douban.com/people/u1/");
    expect(author?.target).toBe("_blank");
  });

  it("renders stars, vote count and more link", () => {
    const root = renderComments(
      makeData({
        comments: [
          makeComment({
            avatar: "https://example.com/avatar.jpg",
            cid: "c123",
            link: "https://douban.com/people/u1/",
            name: "Alice",
            stars: 4,
            votes: 42,
          }),
        ],
      })
    );

    expect(root.querySelector(".atv-comment-stars")).not.toBeNull();
    const voteButton =
      root.querySelector<HTMLButtonElement>(".atv-comment-votes");
    expect(voteButton?.textContent).toContain("42");
    const more = root.querySelector<HTMLAnchorElement>(".atv-section-more");
    expect(more?.href).toBe(
      "https://movie.douban.com/subject/1292052/comments?status=P"
    );
  });

  it("renders the comment vote as an accessible icon toggle", () => {
    const root = renderComments(makeData({ comments: [makeComment()] }));
    const voteButton =
      root.querySelector<HTMLButtonElement>(".atv-comment-votes");

    expect(voteButton?.getAttribute("aria-label")).toBe("有用，5 人觉得有用");
    expect(voteButton?.getAttribute("aria-pressed")).toBe("false");
    expect(voteButton?.querySelector("svg")).not.toBeNull();
  });

  it("uses avatar fallback and omits more link when subject id is empty", () => {
    const root = renderComments(
      makeData({
        comments: [makeComment({ avatar: "", name: "Alice" })],
        subjectId: "",
      })
    );

    expect(root.querySelector(".atv-comment-avatar")?.textContent).toBe("A");
    expect(root.querySelector(".atv-section-more")).toBeNull();
  });

  it("does not add has-overflow when scrollHeight equals clientHeight (no overflow)", () => {
    const root = renderComments(
      makeData({
        comments: [
          makeComment({
            cid: "c1",
            content: "Short text that fits in one line.",
          }),
        ],
      })
    );
    const card = root.querySelector<HTMLElement>(".atv-comment-card");
    expect(card?.classList.contains("has-overflow")).toBeFalsy();
  });

  it("adds has-overflow when scrollHeight exceeds clientHeight (overflow detected)", () => {
    const root = renderIntoRoot(
      <CommentsSection
        comments={[makeComment({ cid: "c1", content: "A".repeat(500) })]}
        onOpen={vi.fn<() => void>()}
        onVote={() => Promise.resolve({ ok: true })}
        subjectId="1292052"
      />
    );

    const body = root.querySelector<HTMLElement>(".atv-comment-body-text");
    expect(body).not.toBeNull();

    const bodyEl = body as HTMLElement;
    Object.defineProperty(bodyEl, "scrollHeight", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(bodyEl, "clientHeight", {
      configurable: true,
      value: 100,
    });

    render(
      <CommentsSection
        comments={[makeComment({ cid: "c1", content: "B".repeat(300) })]}
        onOpen={vi.fn<() => void>()}
        onVote={() => Promise.resolve({ ok: true })}
        subjectId="1292052"
      />,
      root
    );

    const card = root.querySelector<HTMLElement>(".atv-comment-card");
    expect(card?.classList.contains("has-overflow")).toBeTruthy();
  });

  it("calls onOpen on card body click only when card has overflow", async () => {
    const onOpen = vi.fn<() => void>();
    const data = makeData();
    const root = renderIntoRoot(
      <CommentsSection
        comments={data.comments}
        onOpen={onOpen}
        onVote={() => Promise.resolve({ ok: true })}
        subjectId={data.subjectId}
      />
    );

    root.querySelector<HTMLElement>(".atv-comment-body")?.click();
    await Promise.resolve();
    expect(onOpen).not.toHaveBeenCalled();

    root.querySelector(".atv-comment-card")?.classList.add("has-overflow");
    root.querySelector<HTMLElement>(".atv-comment-body")?.click();
    await Promise.resolve();
    expect(onOpen).toHaveBeenCalledWith(data.comments[0]);
  });

  it("does not optimistically vote when the account guard blocks", async () => {
    const canVote = vi.fn<() => boolean>(() => false);
    const onVote = vi.fn<() => Promise<{ count?: number; ok: boolean }>>(() =>
      Promise.resolve({ count: 6, ok: true })
    );
    const root = renderComments(undefined, { canVote, onVote });

    root.querySelector<HTMLButtonElement>(".atv-comment-votes")?.click();
    await Promise.resolve();

    expect(canVote).toHaveBeenCalledOnce();
    expect(onVote).not.toHaveBeenCalled();
    expect(root.querySelector(".atv-comment-votes")?.textContent).toContain(
      "5"
    );
  });

  it("updates vote state after a successful vote", async () => {
    const onVote = vi.fn<() => Promise<{ count?: number; ok: boolean }>>(() =>
      Promise.resolve({ count: 9, ok: true })
    );
    const root = renderComments(undefined, { onVote });

    root.querySelector<HTMLButtonElement>(".atv-comment-votes")?.click();
    await Promise.resolve();
    await Promise.resolve();

    const button = root.querySelector<HTMLButtonElement>(".atv-comment-votes");
    expect(onVote).toHaveBeenCalledWith("c1");
    expect(button?.classList.contains("is-voted")).toBeTruthy();
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(button?.textContent).toContain("9");
  });
});
