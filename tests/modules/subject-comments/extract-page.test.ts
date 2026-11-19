import { describe, expect, it, vi } from "vitest";

import { extractSubjectCommentsPage } from "@/modules/subject-comments/extract/page";

import { createTestDoc } from "../../helpers/doc";
import {
  loggedOutNativePage,
  nativePage,
  nativePageWithoutWatchingStatus,
  pageData,
} from "./page-test-data";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe(extractSubjectCommentsPage, () => {
  it("extracts the complete native reading state and interaction exits", () => {
    const { cleanup, doc } = createTestDoc(
      nativePage,
      "/subject/3016187/comments"
    );

    expect(extractSubjectCommentsPage(doc)).toStrictEqual(pageData);

    cleanup();
  });

  it("accepts a native page that omits an unavailable viewing status", () => {
    const { cleanup, doc } = createTestDoc(
      nativePageWithoutWatchingStatus,
      "/subject/3016187/comments?status=P"
    );

    const data = extractSubjectCommentsPage(doc);

    expect(data?.statuses).toStrictEqual([
      pageData.statuses[0],
      pageData.statuses[2],
    ]);
    expect(data?.comments).toHaveLength(1);

    cleanup();
  });

  it("distinguishes an unauthenticated vote guard from an existing vote", () => {
    const loggedOut = createTestDoc(
      loggedOutNativePage,
      "/subject/3016187/comments?status=P"
    );
    const voted = createTestDoc(
      nativePage.replace(
        '<a class="j vote-comment" href="javascript:;">有用</a>',
        "<span>已投票</span>"
      ),
      "/subject/3016187/comments?status=P"
    );

    expect(
      extractSubjectCommentsPage(
        loggedOut.doc,
        "https://movie.douban.com/subject/3016187/comments?status=P"
      )?.comments[0]?.votes
    ).toStrictEqual({
      canVote: false,
      count: 42,
      requiresLogin: true,
      voted: false,
    });
    expect(
      extractSubjectCommentsPage(
        voted.doc,
        "https://movie.douban.com/subject/3016187/comments?status=P"
      )?.comments[0]?.votes
    ).toStrictEqual({
      canVote: false,
      count: 42,
      requiresLogin: false,
      voted: true,
    });

    loggedOut.cleanup();
    voted.cleanup();
  });

  it("refuses incomplete documents so the native short-comments page remains usable", () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>作品甲的短评</h1></main>',
      "/subject/123/comments"
    );

    expect(extractSubjectCommentsPage(doc)).toBeNull();

    cleanup();
  });

  it("keeps the active non-default status when Douban omits its current-tab link", () => {
    const { cleanup, doc } = createTestDoc(
      nativePage.replace(
        '<li class="is-active"><span>看过(94163)</span></li>\n          <li><a href="https://movie.douban.com/subject/3016187/comments?status=N">在看(3723)</a></li>',
        '<li><a href="https://movie.douban.com/subject/3016187/comments?status=P">看过(94163)</a></li>\n          <li class="is-active"><span>在看(3723)</span></li>'
      ),
      "/subject/3016187/comments"
    );
    Object.defineProperty(doc.location, "href", {
      configurable: true,
      value: "https://movie.douban.com/subject/3016187/comments?status=N",
    });

    expect(extractSubjectCommentsPage(doc)?.statuses).toContainEqual(
      expect.objectContaining({
        active: true,
        href: "https://movie.douban.com/subject/3016187/comments?status=N",
        value: "N",
      })
    );

    cleanup();
  });

  it("changes one browsing axis without discarding the others", () => {
    const { cleanup, doc } = createTestDoc(
      nativePage.replace('value=""', 'value="h" checked'),
      "/subject/3016187/comments"
    );
    Object.defineProperty(doc.location, "href", {
      configurable: true,
      value:
        "https://movie.douban.com/subject/3016187/comments?sort=time&status=P&percent_type=h",
    });

    const data = extractSubjectCommentsPage(doc);

    expect({
      score: data?.scoreFilters.find((filter) => filter.value === "m")?.href,
      status: data?.statuses.find((status) => status.value === "N")?.href,
    }).toStrictEqual({
      score:
        "https://movie.douban.com/subject/3016187/comments?sort=time&status=P&percent_type=m",
      status:
        "https://movie.douban.com/subject/3016187/comments?sort=time&status=N&percent_type=h",
    });

    cleanup();
  });

  it("keeps timestamp metadata when the native page renders it as text", () => {
    const { cleanup, doc } = createTestDoc(
      nativePage
        .replace(
          '<a class="comment-time" href="https://movie.douban.com/comment/1001/" title="2026-07-28 10:00:00">2026-07-28 10:00:00</a>',
          '<span class="comment-time" title="2026-07-28 10:00:00">2026-07-28 10:00:00</span>'
        )
        .replace(
          'href: "https://movie.douban.com/comment/1001/",',
          "href: null,"
        ),
      "/subject/3016187/comments"
    );

    expect(extractSubjectCommentsPage(doc)?.comments[0]?.time).toStrictEqual({
      href: null,
      label: "2026-07-28 10:00:00",
    });

    cleanup();
  });
});
