import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { extractSubjectCommentsPage } from "@/modules/subject-comments/extract/page";
import { SubjectCommentsPage } from "@/modules/subject-comments/presentation/page";

import { createTestDoc, mockCookie } from "../../helpers/doc";
import { loggedOutNativePage, nativePage } from "./page-test-data";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe(SubjectCommentsPage, () => {
  const root = document.createElement("div");

  afterEach(() => {
    render(null, root);
  });

  it("does not render the logged-out native vote guard as an existing vote", () => {
    const { cleanup, doc } = createTestDoc(
      loggedOutNativePage,
      "/subject/3016187/comments?status=P"
    );
    const clearCookie = mockCookie(doc, "");
    const data = extractSubjectCommentsPage(
      doc,
      "https://movie.douban.com/subject/3016187/comments?status=P"
    );

    if (!data) {
      throw new Error("test fixture extraction failed");
    }

    render(<SubjectCommentsPage data={data} doc={doc} />, root);

    const vote = root.querySelector<HTMLButtonElement>(
      ".atv-subject-comments-vote"
    );
    expect({
      ariaPressed: vote?.getAttribute("aria-pressed"),
      disabled: vote?.disabled,
      isVoted: vote?.classList.contains("is-voted"),
    }).toStrictEqual({
      ariaPressed: "false",
      disabled: false,
      isVoted: false,
    });

    clearCookie();
    cleanup();
  });

  it("opens the login modal when a logged-out vote button is clicked", async () => {
    const { cleanup, doc } = createTestDoc(
      loggedOutNativePage,
      "/subject/3016187/comments?status=P"
    );
    const clearCookie = mockCookie(doc, "");
    const data = extractSubjectCommentsPage(
      doc,
      "https://movie.douban.com/subject/3016187/comments?status=P"
    );

    if (!data) {
      throw new Error("test fixture extraction failed");
    }

    render(<SubjectCommentsPage data={data} doc={doc} />, root);
    root
      .querySelector<HTMLButtonElement>(".atv-subject-comments-vote")
      ?.click();

    await vi.waitFor(() =>
      expect(root.querySelector("#atv-login-modal-desc")?.textContent).toBe(
        "登录后才能给短评投票。"
      )
    );

    clearCookie();
    cleanup();
  });

  it("opens the login modal instead of navigating for an unauthenticated native login sort", async () => {
    const { cleanup, doc } = createTestDoc(
      nativePage,
      "/subject/3016187/comments?status=P"
    );
    const clearCookie = mockCookie(doc, "");
    const data = extractSubjectCommentsPage(
      doc,
      "https://movie.douban.com/subject/3016187/comments?status=P"
    );
    const navigate = vi.fn<(href: string, label: string) => void>();

    if (!data) {
      throw new Error("test fixture extraction failed");
    }

    render(
      <SubjectCommentsPage
        doc={doc}
        navigation={{
          data,
          dismissFailure: vi.fn<() => void>(),
          failure: null,
          navigate,
          pending: null,
          refresh: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
          retry: vi.fn<() => void>(),
          version: 0,
        }}
      />,
      root
    );

    root
      .querySelector<HTMLAnchorElement>(
        ".atv-subject-comments-sort-option[href*='sort=time']"
      )
      ?.click();

    await vi.waitFor(() =>
      expect(root.querySelector("#atv-login-modal-desc")?.textContent).toBe(
        "登录后才能查看最新短评。"
      )
    );
    expect(navigate).not.toHaveBeenCalled();

    clearCookie();
    cleanup();
  });

  it("navigates for a signed-in native login sort", () => {
    const { cleanup, doc } = createTestDoc(
      nativePage,
      "/subject/3016187/comments?status=P"
    );
    const clearCookie = mockCookie(doc, "ck=token");
    const data = extractSubjectCommentsPage(
      doc,
      "https://movie.douban.com/subject/3016187/comments?status=P"
    );
    const navigate = vi.fn<(href: string, label: string) => void>();

    if (!data) {
      throw new Error("test fixture extraction failed");
    }

    render(
      <SubjectCommentsPage
        doc={doc}
        navigation={{
          data,
          dismissFailure: vi.fn<() => void>(),
          failure: null,
          navigate,
          pending: null,
          refresh: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
          retry: vi.fn<() => void>(),
          version: 0,
        }}
      />,
      root
    );

    root
      .querySelector<HTMLAnchorElement>(
        ".atv-subject-comments-sort-option[href*='sort=time']"
      )
      ?.click();

    expect(navigate).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/3016187/comments?status=P&sort=time",
      "最新"
    );

    clearCookie();
    cleanup();
  });
});
