/* ── resolveCommentAvatars — Cache Tests ─────────────── */
/* Tests for src/api/avatar.ts. Mocks gmGet so no real HTTP. */

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { Comment } from "../../src/types";

const mockGmGet = vi.hoisted(() => vi.fn());

vi.mock("../../src/utils/request", () => ({
  gmGet: mockGmGet,
}));

const { resolveCommentAvatars } = await import("../../src/api/avatar");

/* ── Helpers ──────────────────────────────────────────── */

const makeProfilePage = (avatarUrl: string): string =>
  `<!DOCTYPE html><html><body><div id="profile"><div class="pic"><img src="${avatarUrl}" /></div></div></body></html>`;

const makeComments = (...links: string[]): Comment[] =>
  links.map(
    (link, i): Comment => ({
      avatar: "",
      cid: String(i + 1),
      content: "",
      link,
      name: "",
      ratingWord: "",
      stars: 0,
      time: "",
      voted: false,
      votes: 0,
    })
  );

/* ── Suite ────────────────────────────────────────────── */

describe("resolveCommentAvatars", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  /* ── Caching ─────────────────────────────────────── */

  it("caches fetched avatar and reuses it on second call (t1)", async () => {
    mockGmGet.mockResolvedValue(
      makeProfilePage("https://example.com/avatar.jpg")
    );

    const comments = makeComments("https://www.douban.com/people/user1/");
    await resolveCommentAvatars(comments);

    // First call: makes HTTP request
    expect(mockGmGet).toHaveBeenCalledTimes(1);

    // Second call with same link: should use cache
    mockGmGet.mockClear();
    const comments2 = makeComments("https://www.douban.com/people/user1/");
    await resolveCommentAvatars(comments2);

    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("re-fetches when cache entry is expired (t2)", async () => {
    // Seed an expired cache entry
    const expired = JSON.stringify([
      [
        "https://www.douban.com/people/user1/",
        { expiresAt: Date.now() - 1000, value: "https://example.com/old.jpg" },
      ],
    ]);
    localStorage.setItem("dp:avatar-cache", expired);

    mockGmGet.mockResolvedValue(makeProfilePage("https://example.com/new.jpg"));

    const comments = makeComments("https://www.douban.com/people/user1/");
    await resolveCommentAvatars(comments);

    // Should fetch because cache was expired
    expect(mockGmGet).toHaveBeenCalledTimes(1);
  });

  it("handles multiple distinct links independently (t3)", async () => {
    mockGmGet.mockResolvedValue(
      makeProfilePage("https://example.com/avatar1.jpg")
    );

    const comments = makeComments(
      "https://www.douban.com/people/user1/",
      "https://www.douban.com/people/user2/"
    );
    await resolveCommentAvatars(comments);

    // One request per unique user
    expect(mockGmGet).toHaveBeenCalledTimes(2);
  });
});
