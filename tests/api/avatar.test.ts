/* ── fetchAvatarUrls — Test Suite ──────────────────────── */
/* Tests for src/api/avatar.ts. Mocks gmGet so no real HTTP. */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGmGet = vi.hoisted(() =>
  vi.fn<(url: string, referer?: string) => Promise<string>>()
);

vi.mock(import("../../src/utils/request"), () => ({
  gmGet: mockGmGet,
}));

const { fetchAvatarUrls } = await import("../../src/api/avatar");

/* ── Helpers ──────────────────────────────────────────── */

const makeProfilePage = (avatarUrl: string): string =>
  `<!DOCTYPE html><html><body><div id="profile"><div class="pic"><img src="${avatarUrl}" /></div></div></body></html>`;

const LINK_A = "https://www.douban.com/people/user1/";
const LINK_B = "https://www.douban.com/people/user2/";
const AVATAR_A = "https://example.com/avatar-a.jpg";
const AVATAR_B = "https://example.com/avatar-b.jpg";

/* ── Suite ────────────────────────────────────────────── */

describe("fetchAvatarUrls", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  /* t1: Basic fetch with 2 distinct links */
  it("fetches avatars for multiple distinct links (t1)", async () => {
    mockGmGet
      .mockResolvedValueOnce(makeProfilePage(AVATAR_A))
      .mockResolvedValueOnce(makeProfilePage(AVATAR_B));

    const result = await fetchAvatarUrls([LINK_A, LINK_B]);

    expect(result.size).toBe(2);
    expect(result.get(LINK_A)).toBe(AVATAR_A);
    expect(result.get(LINK_B)).toBe(AVATAR_B);
  });

  /* t2: Cache re-use — second call with same link hits cache */
  it("reuses cached avatar and skips HTTP on second call (t2)", async () => {
    mockGmGet.mockResolvedValue(makeProfilePage(AVATAR_A));

    await fetchAvatarUrls([LINK_A]);
    expect(mockGmGet).toHaveBeenCalledOnce();

    mockGmGet.mockClear();
    await fetchAvatarUrls([LINK_A]);

    expect(mockGmGet).not.toHaveBeenCalled();
  });

  /* t3: Expired cache entry triggers re-fetch */
  it("re-fetches when cache entry is expired (t3)", async () => {
    const expired = JSON.stringify([
      [LINK_A, { expiresAt: Date.now() - 1000, value: AVATAR_A }],
    ]);
    localStorage.setItem("dp:avatar-cache", expired);

    mockGmGet.mockResolvedValue(makeProfilePage("https://example.com/new.jpg"));

    const result = await fetchAvatarUrls([LINK_A]);

    expect(mockGmGet).toHaveBeenCalledOnce();
    expect(result.get(LINK_A)).toBe("https://example.com/new.jpg");
  });

  /* t4: Empty input returns empty Map */
  it("returns empty Map for empty link array (t4)", async () => {
    const result = await fetchAvatarUrls([]);

    expect(result.size).toBe(0);
    expect(mockGmGet).not.toHaveBeenCalled();
  });

  /* t5: Fetch failure returns empty URL for that link */
  it("returns empty string for a link when fetch fails (t5)", async () => {
    mockGmGet.mockRejectedValue(new Error("Network error"));

    const result = await fetchAvatarUrls([LINK_A]);

    expect(result.size).toBe(1);
    expect(result.get(LINK_A)).toBe("");
  });

  /* t6: Mixed success and failure across multiple links */
  it("handles mixed success and failure across multiple links (t6)", async () => {
    mockGmGet
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(makeProfilePage(AVATAR_B));

    const result = await fetchAvatarUrls([LINK_A, LINK_B]);

    expect(result.size).toBe(2);
    expect(result.get(LINK_A)).toBe("");
    expect(result.get(LINK_B)).toBe(AVATAR_B);
  });
});
