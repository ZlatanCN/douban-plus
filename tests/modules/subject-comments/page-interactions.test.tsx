import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SubjectCommentsPage } from "@/modules/subject-comments/presentation/page";
import type { SubjectCommentsNavigationState } from "@/modules/subject-comments/runtime/navigation";

import { createTestDoc, mockCookie } from "../../helpers/doc";
import { nativePage, pageData } from "./page-test-data";

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

  it("renders all three browsing axes, full comment text, and native exits", () => {
    render(<SubjectCommentsPage data={pageData} doc={document} />, root);

    expect({
      content: root.querySelector(".atv-subject-comments-content")?.textContent,
      isClamped: root
        .querySelector(".atv-subject-comments-content")
        ?.classList.contains("is-clamped"),
      scoreCount: root.querySelectorAll(".atv-subject-comments-score-option")
        .length,
      statusCount: root.querySelectorAll(".atv-subject-comments-status").length,
      subjectHref: root.querySelector<HTMLAnchorElement>(
        ".atv-subject-comments-back"
      )?.href,
      title: root.querySelector("h1")?.textContent,
    }).toStrictEqual({
      content: pageData.comments[0]?.content,
      isClamped: false,
      scoreCount: 4,
      statusCount: 3,
      subjectHref: pageData.subjectHref,
      title: "权力的游戏 第一季",
    });
  });

  it("sizes the status index to the native options and preserves their order and selection", () => {
    const variants = [
      pageData.statuses.slice(1, 2).map((status) => ({
        ...status,
        active: true,
      })),
      pageData.statuses
        .filter((status) => status.value !== "N")
        .map((status) => ({ ...status, active: status.value === "F" })),
      pageData.statuses.map((status) => ({
        ...status,
        active: status.value === "F",
      })),
    ];

    for (const statuses of variants) {
      render(
        <SubjectCommentsPage data={{ ...pageData, statuses }} doc={document} />,
        root
      );

      const index = root.querySelector<HTMLElement>(
        ".atv-subject-comments-status-index"
      );
      const links = [
        ...root.querySelectorAll<HTMLAnchorElement>(
          ".atv-subject-comments-status"
        ),
      ];

      expect(
        index?.style.getPropertyValue("--atv-subject-comments-status-count")
      ).toBe(String(statuses.length));
      expect(
        links.map((link) => ({
          active: link.getAttribute("aria-current") === "page",
          count: link.querySelector("strong")?.textContent,
          href: link.href,
          label: link.querySelector("span")?.textContent,
        }))
      ).toStrictEqual(
        statuses.map((status) => ({
          active: status.active,
          count: new Intl.NumberFormat("zh-CN").format(status.count),
          href: status.href,
          label: status.label,
        }))
      );
    }
  });

  it("keeps the reading stream in place while a selected browsing axis loads", () => {
    const navigate = vi.fn<(href: string, label: string) => void>();
    const navigation: SubjectCommentsNavigationState = {
      data: pageData,
      dismissFailure: vi.fn<() => void>(),
      failure: null,
      navigate,
      pending: null,
      refresh: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
      retry: vi.fn<() => void>(),
      version: 0,
    };
    render(
      <SubjectCommentsPage doc={document} navigation={navigation} />,
      root
    );

    root
      .querySelectorAll<HTMLAnchorElement>(".atv-subject-comments-status")[1]
      ?.click();

    expect(navigate).toHaveBeenCalledWith(
      pageData.statuses[1]?.href,
      pageData.statuses[1]?.label
    );

    render(
      <SubjectCommentsPage
        doc={document}
        navigation={{
          ...navigation,
          pending: {
            href: pageData.statuses[1]?.href ?? "",
            label: "在看",
            source: "user",
          },
        }}
      />,
      root
    );
    expect(
      root
        .querySelector(".atv-subject-comments-stream")
        ?.getAttribute("aria-busy")
    ).toBe("true");
    expect(
      root.querySelector(".atv-subject-comments-stream")?.classList
    ).toContain("is-loading");
    expect(
      root.querySelectorAll(".atv-subject-comments-status")[1]?.classList
    ).toContain("is-active");
  });

  it("delegates native interactions and reconciles a completed vote", async () => {
    const { cleanup, doc } = createTestDoc(
      nativePage,
      "/subject/3016187/comments"
    );
    const vote = doc.querySelector<HTMLAnchorElement>(".vote-comment");
    const onVote = vi.fn<(event: Event) => void>();
    vote?.addEventListener("click", () => {
      const count = doc.querySelector(".vote-count");
      if (count) {
        count.textContent = "43";
      }
      vote?.replaceWith(doc.createTextNode("已投票"));
    });
    vote?.addEventListener("click", onVote);

    render(<SubjectCommentsPage data={pageData} doc={doc} />, root);
    root
      .querySelector<HTMLButtonElement>(".atv-subject-comments-write")
      ?.click();
    root
      .querySelector<HTMLButtonElement>(".atv-subject-comments-vote")
      ?.click();

    await Promise.resolve();

    expect(root.querySelector("#atv-login-modal")).not.toBeNull();
    expect(onVote).toHaveBeenCalledOnce();
    expect(
      root.querySelector(".atv-subject-comments-consensus")?.textContent
    ).toContain("43");
    expect(
      root.querySelector<HTMLButtonElement>(".atv-subject-comments-vote")
        ?.disabled
    ).toBeTruthy();
    cleanup();
  });

  it("opens the shared interest form directly for a signed-in user", async () => {
    const { cleanup, doc } = createTestDoc(
      nativePage,
      "/subject/3016187/comments"
    );
    const restoreCookie = mockCookie(doc, "ck=token");
    const write = doc.querySelector<HTMLAnchorElement>(".a_collect_btn");
    const onWrite = vi.fn<(event: Event) => void>();
    write?.addEventListener("click", onWrite);

    render(<SubjectCommentsPage data={pageData} doc={doc} />, root);
    root
      .querySelector<HTMLButtonElement>(".atv-subject-comments-write")
      ?.click();

    await Promise.resolve();

    expect(root.querySelector("#atv-interest-modal")).not.toBeNull();
    expect(onWrite).not.toHaveBeenCalled();

    restoreCookie();
    cleanup();
  });
});
