import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Comment } from "@/modules/subject/domain";
import { useResolvedComments } from "@/modules/subject/runtime/use-resolved-comments";

const mockRequest = vi.hoisted(() =>
  vi.fn<(url: string, ...args: unknown[]) => Promise<string>>()
);

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGet: mockRequest,
}));

const makeComment = (overrides?: Partial<Comment>): Comment => ({
  avatar: "",
  cid: "resolved-comment",
  content: "已解析评论",
  link: "",
  name: "Resolved viewer",
  ratingWord: "推荐",
  stars: 4,
  time: "2026-07-16",
  voted: false,
  votes: 1,
  ...overrides,
});

const ResolvedCommentsProbe = ({ comments }: { comments: Comment[] }) => {
  const resolvedComments = useResolvedComments(comments, document);
  return (
    <output
      data-avatars={resolvedComments.map(({ avatar }) => avatar).join("|")}
    />
  );
};

const renderProbe = (comments: Comment[]): HTMLElement => {
  const root = document.createElement("div");
  render(<ResolvedCommentsProbe comments={comments} />, root);
  return root;
};

describe("Resolved comments runtime hook", () => {
  afterEach(() => {
    mockRequest.mockReset();
    vi.unstubAllGlobals();
  });

  it("deduplicates profile lookup and applies avatar fallback without mutating extracted comments", async () => {
    const profileLink = "https://www.douban.com/people/resolved-avatar/";
    const avatarUrl = "https://example.com/resolved-avatar.jpg";
    const rawAvatarUrl = "https://example.com/raw-avatar.jpg";
    const comments = [
      makeComment({
        avatar: rawAvatarUrl,
        cid: "resolved-first",
        link: profileLink,
      }),
      makeComment({
        avatar: rawAvatarUrl,
        cid: "resolved-second",
        link: profileLink,
      }),
      makeComment({ avatar: rawAvatarUrl, cid: "resolved-fallback" }),
    ];
    mockRequest.mockResolvedValue(
      `<div id="profile"><div class="pic"><img src="${avatarUrl}" /></div></div>`
    );
    const root = renderProbe(comments);

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.avatars).toBe(
        `${avatarUrl}|${avatarUrl}|${rawAvatarUrl}`
      )
    );

    expect(comments[0]?.avatar).toBe(rawAvatarUrl);
    expect(mockRequest).toHaveBeenCalledExactlyOnceWith(
      profileLink,
      document.location.href
    );
  });

  it("keeps a linked comment's original avatar when profile lookup fails", async () => {
    const rawAvatarUrl = "https://example.com/failed-avatar.jpg";
    mockRequest.mockRejectedValue(new Error("profile unavailable"));
    const root = renderProbe([
      makeComment({
        avatar: rawAvatarUrl,
        link: "https://www.douban.com/people/resolved-failure/",
      }),
    ]);

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.avatars).toBe(rawAvatarUrl)
    );
  });
});
