/* ── buildComments — Unit Tests ──────────────────────────── */
/* Tests the comments section builder for rendering            */
/* individual comment cards with avatars, author, body, votes. */

import { describe, it, expect } from "vitest";

import { buildComments } from "../../src/build/comments";
import type { Comment, CommentsData } from "../../src/types";

/* ── Factory helpers ─────────────────────────────────────── */

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  avatar: "",
  cid: "",
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
  comments: [makeComment({ cid: "c1" })],
  subjectId: "1292052",
  ...overrides,
});

const noopVote = (): Promise<{ ok: boolean; count?: number }> =>
  Promise.resolve({ ok: true });

/* ── Tests ─────────────────────────────────────────────────── */

describe("buildComments", () => {
  /* ── Null return ────────────────────────────────────────── */

  it("returns null when comments array is empty (t1)", () => {
    expect(buildComments(makeData({ comments: [] }), noopVote)).toBeNull();
  });

  /* ── Section structure ─────────────────────────────────── */

  it("returns a section with class atv-section and id atv-comments (t2)", () => {
    const section = buildComments(makeData(), noopVote) as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("atv-comments");
    expect(section.classList.contains("atv-section")).toBe(true);
  });

  it("section has h2 header with 热门短评 text (t3)", () => {
    const section = buildComments(makeData(), noopVote) as HTMLElement;
    const header = section.querySelector("h2.atv-section-h");
    expect(header).not.toBeNull();
    expect(header?.textContent).toBe("热门短评");
  });

  it("section contains a div.atv-comments grid child (t4)", () => {
    const section = buildComments(makeData(), noopVote) as HTMLElement;
    const grid = section.querySelector("div.atv-comments");
    expect(grid).not.toBeNull();
  });

  /* ── Comment card structure ────────────────────────────── */

  it("each comment renders as div.atv-comment-card (t5)", () => {
    const section = buildComments(makeData(), noopVote) as HTMLElement;
    const card = section.querySelector("div.atv-comment-card");
    expect(card).not.toBeNull();
  });

  it("avatar has background-image when comment.avatar is provided (t6)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ avatar: "https://example.com/ava.jpg" })],
      }),
      noopVote
    ) as HTMLElement;
    const avatar = section.querySelector(
      ".atv-comment-card .atv-comment-avatar"
    ) as HTMLElement;
    expect(avatar).not.toBeNull();
    expect(avatar.style.backgroundImage).toContain("example.com/ava.jpg");
  });

  it("avatar shows first letter of name when avatar is empty (t7)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ avatar: "", name: "Alice" })],
      }),
      noopVote
    ) as HTMLElement;
    const avatar = section.querySelector(
      ".atv-comment-card .atv-comment-avatar"
    ) as HTMLElement;
    expect(avatar).not.toBeNull();
    expect(avatar.textContent).toBe("A");
  });

  it("author with link renders as anchor with href, rel, target (t8)", () => {
    const section = buildComments(
      makeData({
        comments: [
          makeComment({
            link: "https://douban.com/people/u1/",
            name: "Alice",
          }),
        ],
      }),
      noopVote
    ) as HTMLElement;
    const author = section.querySelector(
      ".atv-comment-card .atv-comment-author"
    ) as HTMLElement;
    expect(author).not.toBeNull();
    expect(author.tagName).toBe("A");
    expect(author.textContent).toBe("Alice");
    expect(author.getAttribute("href")).toBe("https://douban.com/people/u1/");
    expect(author.getAttribute("rel")).toBe("noopener");
    expect(author.getAttribute("target")).toBe("_blank");
  });

  it("author without link renders as div with no href (t9)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ link: "", name: "Bob" })],
      }),
      noopVote
    ) as HTMLElement;
    const author = section.querySelector(
      ".atv-comment-card .atv-comment-author"
    ) as HTMLElement;
    expect(author).not.toBeNull();
    expect(author.tagName).toBe("DIV");
    expect(author.textContent).toBe("Bob");
  });

  /* ── Body ──────────────────────────────────────────────── */

  it("body contains the comment content text (t10)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ content: "This is a great movie!" })],
      }),
      noopVote
    ) as HTMLElement;
    const body = section.querySelector(
      ".atv-comment-card .atv-comment-body"
    ) as HTMLElement;
    expect(body).not.toBeNull();
    expect(body.textContent).toBe("This is a great movie!");
  });

  /* ── Footer / time ────────────────────────────────────── */

  it("footer displays the comment time (t11)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ time: "2024-01-15" })],
      }),
      noopVote
    ) as HTMLElement;
    const foot = section.querySelector(".atv-comment-card .atv-comment-foot");
    expect(foot).not.toBeNull();
    expect(foot?.textContent).toContain("2024-01-15");
  });

  /* ── Multiple comments ─────────────────────────────────── */

  it("renders correct number of cards for multiple comments (t12)", () => {
    const section = buildComments(
      makeData({
        comments: [
          makeComment({ cid: "c1" }),
          makeComment({ cid: "c2" }),
          makeComment({ cid: "c3" }),
        ],
      }),
      noopVote
    ) as HTMLElement;
    const cards = section.querySelectorAll(".atv-comment-card");
    expect(cards.length).toBe(3);
  });

  /* ── data-cid ──────────────────────────────────────────── */

  it("card has data-cid attribute when comment.cid is set (t13)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c12345" })],
      }),
      noopVote
    ) as HTMLElement;
    const card = section.querySelector(".atv-comment-card") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.dataset.cid).toBe("c12345");
  });

  /* ── Vote count ────────────────────────────────────────── */

  it("vote count is displayed inside atv-comment-votes button (t14)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1", votes: 42 })],
      }),
      noopVote
    ) as HTMLElement;
    const voteBtn = section.querySelector(
      ".atv-comment-card .atv-comment-votes"
    ) as HTMLElement;
    expect(voteBtn).not.toBeNull();
    expect(voteBtn.textContent).toContain("42");
  });

  /* ── subjectId → moreLink ─────────────────────────────── */

  it("moreLink renders when subjectId is present (t15)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1" })],
        subjectId: "1292052",
      }),
      noopVote
    ) as HTMLElement;
    const link = section.querySelector(".atv-section-more") as HTMLElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe("查看全部 →");
    expect(link.getAttribute("href")).toBe(
      "https://movie.douban.com/subject/1292052/comments?status=P"
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  });

  it("moreLink is omitted when subjectId is empty (t16)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1" })],
        subjectId: "",
      }),
      noopVote
    ) as HTMLElement;
    expect(section.querySelector(".atv-section-more")).toBeNull();
  });

  /* ── Stars ─────────────────────────────────────────────── */

  it("renders stars when comment.stars > 0 (t17)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1", stars: 4 })],
      }),
      noopVote
    ) as HTMLElement;
    const stars = section.querySelector(".atv-comment-card .atv-comment-stars");
    expect(stars).not.toBeNull();
  });

  it("does not render stars when comment.stars is 0", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1", stars: 0 })],
      }),
      noopVote
    ) as HTMLElement;
    const stars = section.querySelector(".atv-comment-card .atv-comment-stars");
    expect(stars).toBeNull();
  });

  /* ── Voted state ───────────────────────────────────────── */

  it("vote button gets is-voted class when voted is true (t18)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1", voted: true })],
      }),
      noopVote
    ) as HTMLElement;
    const voteBtn = section.querySelector(
      ".atv-comment-card .atv-comment-votes"
    ) as HTMLElement;
    expect(voteBtn).not.toBeNull();
    expect(voteBtn.classList.contains("is-voted")).toBe(true);
  });

  it("vote button omits is-voted class when voted is false", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1", voted: false })],
      }),
      noopVote
    ) as HTMLElement;
    const voteBtn = section.querySelector(
      ".atv-comment-card .atv-comment-votes"
    ) as HTMLElement;
    expect(voteBtn).not.toBeNull();
    expect(voteBtn.classList.contains("is-voted")).toBe(false);
  });

  /* ── Expand button ────────────────────────────────────── */

  it("card has an atv-comment-expand button (t19)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1" })],
      }),
      noopVote
    ) as HTMLElement;
    const expandBtn = section.querySelector(
      ".atv-comment-card .atv-comment-expand"
    );
    expect(expandBtn).not.toBeNull();
    expect(expandBtn?.tagName).toBe("BUTTON");
  });

  /* ── Click does not throw ──────────────────────────────── */

  it("clicking card body does not throw (t20)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1", content: "Short" })],
      }),
      noopVote
    ) as HTMLElement;
    const body = section.querySelector(
      ".atv-comment-card .atv-comment-body"
    ) as HTMLElement;
    expect(body).not.toBeNull();
    expect(() => {
      body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }).not.toThrow();
  });

  it("clicking expand button does not throw (t21)", () => {
    const section = buildComments(
      makeData({
        comments: [makeComment({ cid: "c1" })],
      }),
      noopVote
    ) as HTMLElement;
    const expandBtn = section.querySelector(
      ".atv-comment-card .atv-comment-expand"
    ) as HTMLElement;
    expect(expandBtn).not.toBeNull();
    expect(() => {
      expandBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }).not.toThrow();
  });
});
