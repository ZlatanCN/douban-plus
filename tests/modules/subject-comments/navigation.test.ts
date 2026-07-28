import { afterEach, describe, expect, it, vi } from "vitest";

import type { SubjectCommentsPageData } from "@/modules/subject-comments/domain";
import {
  createSubjectCommentsNavigator,
  fetchSubjectCommentsPage,
} from "@/modules/subject-comments/runtime/navigation";
import type {
  SubjectCommentsNavigationResult,
  SubjectCommentsNavigationTarget,
  SubjectCommentsPageLoader,
} from "@/modules/subject-comments/runtime/navigation";

import { createTestDoc } from "../../helpers/doc";

const page = (title: string): SubjectCommentsPageData => ({
  comments: [],
  pagination: [],
  scoreFilters: [],
  sorts: [],
  statuses: [],
  subjectHref: "https://movie.douban.com/subject/3016187/",
  subjectId: "3016187",
  title,
  writeActionAvailable: false,
});

const sourceContent = (title: string): HTMLElement => {
  const source = new DOMParser().parseFromString(
    `<main id="content"><h1>${title}</h1></main>`,
    "text/html"
  );
  const content = source.querySelector<HTMLElement>("#content");
  if (!content) {
    throw new Error("test source content missing");
  }
  return content;
};

const remotePage = `
  <main id="content"><h1>远方作品的短评</h1>
    <ul class="CommentTabs">
      <li><a href="https://movie.douban.com/subject/3016187/comments?status=P">看过(10)</a></li>
      <li class="is-active"><span>在看(2)</span></li>
      <li><a href="https://movie.douban.com/subject/3016187/comments?status=F">想看(1)</a></li>
    </ul>
    <div class="Comments-sortby"><span>热门</span><a href="https://movie.douban.com/subject/3016187/comments?sort=time&status=N">最新</a></div>
    <div class="comment-filter"><label><input checked type="radio" value=""><span>全部</span></label></div>
    <div id="comments"><div class="comment-item" data-cid="1"><div class="avatar"><img src="https://img3.doubanio.com/icon/u1.jpg"></div><div class="comment-info"><a href="/people/a/">甲</a><span>在看</span><span class="allstar40 rating"></span><span class="comment-time">今天</span></div><p class="comment-content"><span class="full">完整内容</span></p><span class="vote-count">3</span><a class="vote-comment"></a></div></div>
  </main>`;

const deferred = <T>() => Promise.withResolvers<T>();

describe(createSubjectCommentsNavigator, () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches a same-origin comments page and extracts it at the response URL", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(remotePage, {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetch);

    const result = await fetchSubjectCommentsPage(
      "https://movie.douban.com/subject/3016187/comments?sort=time&status=N",
      new AbortController().signal
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/3016187/comments?sort=time&status=N",
      expect.objectContaining({ credentials: "include" })
    );
    expect(result.data.statuses.find((status) => status.active)?.value).toBe(
      "N"
    );
    expect(result.data.comments[0]?.author.href).toBe(
      "https://movie.douban.com/people/a/"
    );
    expect(result.nativeContent.id).toBe("content");
  });

  it("keeps only the latest navigation result and replaces the hidden native page", async () => {
    const { cleanup, doc } = createTestDoc(
      '<main id="content"><h1>旧短评</h1></main>',
      "/subject/3016187/comments"
    );
    const first = deferred<SubjectCommentsNavigationResult>();
    const second = deferred<SubjectCommentsNavigationResult>();
    const loadPage = vi
      .fn<SubjectCommentsPageLoader>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const success =
      vi.fn<
        (
          result: SubjectCommentsNavigationResult,
          target: SubjectCommentsNavigationTarget
        ) => void
      >();
    const navigator = createSubjectCommentsNavigator({
      doc,
      loadPage,
      onFailure: vi.fn<(target: SubjectCommentsNavigationTarget) => void>(),
      onPending: vi.fn<(target: SubjectCommentsNavigationTarget) => void>(),
      onSuccess: success,
    });

    navigator.navigate({
      href: "https://movie.douban.com/subject/3016187/comments?sort=time&status=P",
      label: "最新",
      source: "user",
    });
    navigator.navigate({
      href: "https://movie.douban.com/subject/3016187/comments?percent_type=h&status=P",
      label: "好评",
      source: "user",
    });

    expect(loadPage.mock.calls[0]?.[1].aborted).toBeTruthy();

    first.resolve({
      data: page("过期短评"),
      href: "https://movie.douban.com/subject/3016187/comments?sort=time&status=P",
      nativeContent: sourceContent("过期短评"),
    });
    second.resolve({
      data: page("好评短评"),
      href: "https://movie.douban.com/subject/3016187/comments?percent_type=h&status=P",
      nativeContent: sourceContent("好评短评"),
    });
    await vi.waitFor(() =>
      expect(success).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ data: page("好评短评") }),
        expect.objectContaining({ source: "user" })
      )
    );
    expect(doc.querySelector("#content h1")?.textContent).toBe("好评短评");

    navigator.dispose();
    cleanup();
  });
});
