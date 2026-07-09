/* ── applyCommentAvatars — RED Phase Tests ─────────────── */
/* Tests for the new avatar-apply API that maps comment links */
/* to avatar URLs and sets DOM elements with preloaded images. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { applyCommentAvatars } from "@/components/avatar-dom";
import type { Comment } from "@/types";

/* ── Mock Image: trigger load synchronously via stub RAF ── */

const mockImageLoad = vi.fn<(img: HTMLImageElement) => void>();

/* ── Factory helpers ─────────────────────────────────────── */

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  avatar: "",
  cid: "1",
  content: "Great!",
  link: "https://douban.com/people/user1/",
  name: "User1",
  ratingWord: "",
  stars: 0,
  time: "",
  voted: false,
  votes: 0,
  ...overrides,
});

const setupDom = (cid: string): void => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="atv-comment-card" data-cid="${cid}">
      <div class="atv-comment-avatar"></div>
    </div>
    <div class="atv-comment-overlay-avatar" data-cid="${cid}"></div>`
  );
};

describe("applyCommentAvatars(urlMap, comments)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Image",
      vi.fn<() => HTMLImageElement>(() => {
        const img = document.createElement("img");
        setTimeout(() => {
          img.dispatchEvent(new Event("load"));
          mockImageLoad(img);
        }, 0);
        return img;
      })
    );

    /* eslint-disable promise/prefer-await-to-callbacks — RAF is callback-based */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (cb: FrameRequestCallback): number => {
        cb(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  /* ── Tests ───────────────────────────────────────────────── */
  /* ── t1: Assigns comment.avatar ──────────────────────── */

  it("sets comment.avatar from the urlMap entry (t1)", () => {
    const urlMap = new Map([
      [
        "https://douban.com/people/user1/",
        "https://img.example.com/avatar1.jpg",
      ],
    ]);
    const comments = [makeComment()];

    applyCommentAvatars(urlMap, comments);

    expect(comments[0].avatar).toBe("https://img.example.com/avatar1.jpg");
  });

  /* ── t2: Card avatar backgroundImage ─────────────────── */

  it("sets backgroundImage on the card avatar element (t2)", () => {
    const url = "https://img.example.com/avatar1.jpg";
    const urlMap = new Map([["https://douban.com/people/user1/", url]]);
    const comments = [makeComment({ cid: "1" })];
    setupDom("1");

    applyCommentAvatars(urlMap, comments);

    const cardEl = document.querySelector(
      '.atv-comment-card[data-cid="1"] .atv-comment-avatar'
    ) as HTMLElement;
    expect(cardEl.style.backgroundImage).toContain(url);
  });

  /* ── t3: Overlay avatar backgroundImage ──────────────── */

  it("sets backgroundImage on the overlay avatar element (t3)", () => {
    const url = "https://img.example.com/avatar1.jpg";
    const urlMap = new Map([["https://douban.com/people/user1/", url]]);
    const comments = [makeComment({ cid: "1" })];
    setupDom("1");

    applyCommentAvatars(urlMap, comments);

    const overlayEl = document.querySelector(
      '.atv-comment-overlay-avatar[data-cid="1"]'
    ) as HTMLElement;
    expect(overlayEl.style.backgroundImage).toContain(url);
  });

  /* ── t4: atv-avatar-loaded class added on Image load ── */

  it("adds atv-avatar-loaded class to card & overlay on image load (t4)", () => {
    const urlMap = new Map([
      [
        "https://douban.com/people/user1/",
        "https://img.example.com/avatar1.jpg",
      ],
    ]);
    const comments = [makeComment({ cid: "1" })];
    setupDom("1");

    applyCommentAvatars(urlMap, comments);

    const cardEl = document.querySelector(
      '.atv-comment-card[data-cid="1"] .atv-comment-avatar'
    ) as HTMLElement;
    const overlayEl = document.querySelector(
      '.atv-comment-overlay-avatar[data-cid="1"]'
    ) as HTMLElement;

    expect(cardEl.classList.contains("atv-avatar-loaded")).toBeTruthy();
    expect(overlayEl.classList.contains("atv-avatar-loaded")).toBeTruthy();
  });

  /* ── t5: No-op when link not in map ─────────────────── */

  it("does nothing when comment.link is not in the urlMap (t5)", () => {
    const urlMap = new Map([
      ["https://douban.com/people/other/", "https://img.example.com/other.jpg"],
    ]);
    const comment = makeComment({ avatar: "" });
    const comments = [comment];

    applyCommentAvatars(urlMap, comments);

    expect(comment.avatar).toBe("");
  });

  /* ── t6: Missing DOM elements do not throw ──────────── */

  it("does not throw when DOM elements are absent (t6)", () => {
    const urlMap = new Map([
      [
        "https://douban.com/people/user1/",
        "https://img.example.com/avatar1.jpg",
      ],
    ]);
    const comments = [makeComment({ cid: "1" })];

    /* Intentionally NOT calling setupDom — DOM is empty */
    expect(() => applyCommentAvatars(urlMap, comments)).not.toThrow();
  });

  /* ── t7: Empty urlMap ────────────────────────────────── */

  it("is a no-op when urlMap is empty (t7)", () => {
    const urlMap = new Map();
    const comment = makeComment({ avatar: "" });
    const comments = [comment];

    applyCommentAvatars(urlMap, comments);

    expect(comment.avatar).toBe("");
  });

  /* ── t8: Multiple comments ───────────────────────────── */

  it("processes multiple comments in sequence (t8)", () => {
    const urlMap = new Map([
      [
        "https://douban.com/people/user1/",
        "https://img.example.com/avatar1.jpg",
      ],
      [
        "https://douban.com/people/user2/",
        "https://img.example.com/avatar2.jpg",
      ],
    ]);
    const comments = [
      makeComment({ cid: "1", link: "https://douban.com/people/user1/" }),
      makeComment({ cid: "2", link: "https://douban.com/people/user2/" }),
    ];
    setupDom("1");
    setupDom("2");

    applyCommentAvatars(urlMap, comments);

    expect(comments[0].avatar).toBe("https://img.example.com/avatar1.jpg");
    expect(comments[1].avatar).toBe("https://img.example.com/avatar2.jpg");

    const card1 = document.querySelector(
      '.atv-comment-card[data-cid="1"] .atv-comment-avatar'
    ) as HTMLElement;
    const card2 = document.querySelector(
      '.atv-comment-card[data-cid="2"] .atv-comment-avatar'
    ) as HTMLElement;

    expect(card1.style.backgroundImage).toContain("avatar1.jpg");
    expect(card2.style.backgroundImage).toContain("avatar2.jpg");
  });
});
