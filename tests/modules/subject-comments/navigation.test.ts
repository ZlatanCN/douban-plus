import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSubjectCommentsPage } from "@/modules/subject-comments/runtime/navigation";

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

describe(fetchSubjectCommentsPage, () => {
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
});
