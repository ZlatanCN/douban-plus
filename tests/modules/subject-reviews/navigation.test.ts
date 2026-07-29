import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSubjectReviewsPage } from "@/modules/subject-reviews/runtime/navigation";

const remoteRatingPage = `
  <title>权力的游戏 第一季的5星剧评 (395)</title>
  <main id="content">
    <ul class="top-tab">
      <li><a href="?sort=hotest">最受欢迎的</a></li>
      <li><a href="?sort=time">最新发布的</a></li>
      <li><a href="?sort=follow">我关注的</a></li>
      <li class="dropdown"><a href="javascript:;">给5星的评论</a><ul class="droplist"><li><a href="?rating=">全部 (395)</a></li><li><a href="?rating=5">给5星的评论 (395)</a></li></ul></li>
      <li><a class="create-review" href="/subject/3016187/new_review">我来写评论</a></li>
    </ul>
    <div class="review-list">
      <div class="main review-item" id="6111130">
        <header class="main-hd"><a class="avator"><img src="https://example.com/avatar.jpg"></a><a class="name" href="/people/a/">甲</a><span class="allstar50 main-title-rating" title="力荐"></span><span class="main-meta">2011-04-18</span></header>
        <div class="main-bd"><h2><a href="/review/6111130/">真实评分目录条目</a></h2><div class="review-short"><div class="short-content">正文摘要</div></div><div class="action"><a class="up">21</a><a class="down">3</a><a class="reply" href="/review/6111130/#comments">4回应</a></div></div>
      </div>
    </div>
  </main>`;

describe(fetchSubjectReviewsPage, () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the real no-H1 rating response without falling back to a page refresh", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(remoteRatingPage, { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    const result = await fetchSubjectReviewsPage(
      "https://movie.douban.com/subject/3016187/reviews?rating=5",
      new AbortController().signal
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://movie.douban.com/subject/3016187/reviews?rating=5",
      expect.objectContaining({ credentials: "include" })
    );
    expect(result.data.title).toBe("权力的游戏 第一季");
    expect(result.data.sorts.find((option) => option.active)?.value).toBe(
      "hotest"
    );
    expect(result.data.ratings.find((option) => option.active)?.value).toBe(
      "5"
    );
    expect(result.nativeContent.id).toBe("content");
  });
});
