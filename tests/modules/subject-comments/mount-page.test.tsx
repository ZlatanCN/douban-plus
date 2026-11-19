import { describe, expect, it, vi } from "vitest";

import {
  isSubjectCommentsPage,
  mountSubjectComments,
} from "@/modules/subject-comments/runtime/mount";

import { createTestDoc } from "../../helpers/doc";
import { nativePage, nativePageWithoutWatchingStatus } from "./page-test-data";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe(mountSubjectComments, () => {
  it("matches only the short-comments secondary route", () => {
    expect(
      isSubjectCommentsPage({
        hostname: "movie.douban.com",
        pathname: "/subject/3016187/comments",
      })
    ).toBeTruthy();
    expect(
      isSubjectCommentsPage({
        hostname: "movie.douban.com",
        pathname: "/subject/3016187/comments/",
      })
    ).toBeTruthy();
    expect(
      isSubjectCommentsPage({
        hostname: "movie.douban.com",
        pathname: "/subject/3016187/photos",
      })
    ).toBeFalsy();
    expect(
      isSubjectCommentsPage({
        hostname: "movie.douban.com",
        pathname: "/subject/3016187/",
      })
    ).toBeFalsy();
  });

  it("mounts only after complete extraction", () => {
    const ready = createTestDoc(nativePage, "/subject/3016187/comments");
    const withoutWatchingStatus = createTestDoc(
      nativePageWithoutWatchingStatus,
      "/subject/3016187/comments?status=P"
    );
    const fallback = createTestDoc(
      '<main id="content"><h1>作品甲的短评</h1></main>',
      "/subject/123/comments"
    );

    mountSubjectComments(ready.doc);
    mountSubjectComments(withoutWatchingStatus.doc);
    mountSubjectComments(fallback.doc);

    expect({
      fallbackEnhanced: fallback.doc.body.classList.contains("atv-enhanced"),
      fallbackRoot: fallback.doc.querySelector("#atv-douban-root"),
      readyEnhanced: ready.doc.body.classList.contains("atv-enhanced"),
      readyTitle: ready.doc.querySelector("#atv-douban-root h1")?.textContent,
      withoutWatchingStatusEnhanced:
        withoutWatchingStatus.doc.body.classList.contains("atv-enhanced"),
      withoutWatchingStatusTitle: withoutWatchingStatus.doc.querySelector(
        "#atv-douban-root h1"
      )?.textContent,
    }).toStrictEqual({
      fallbackEnhanced: false,
      fallbackRoot: null,
      readyEnhanced: true,
      readyTitle: "权力的游戏 第一季",
      withoutWatchingStatusEnhanced: true,
      withoutWatchingStatusTitle: "权力的游戏 第一季",
    });

    ready.cleanup();
    withoutWatchingStatus.cleanup();
    fallback.cleanup();
  });
});
