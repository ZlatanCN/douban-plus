import { afterEach, describe, expect, it, vi } from "vitest";

import { mountSubjectReviews } from "@/modules/subject-reviews";

import { createTestDoc } from "../../helpers/doc";

const reviewDirectory = `
  <ul class="top-tab">
    <li class="selected"><a href="javascript:;">最受欢迎的</a></li>
    <li><a href="?sort=time">最新发布的</a></li>
    <li><a href="?sort=follow">我关注的</a></li>
    <li class="dropdown"><a href="javascript:;">按评星查看</a><ul class="droplist"><li><a href="?rating=">全部 (677)</a></li></ul></li>
    <li><a class="create-review" href="/subject/3016187/new_review">我来写评论</a></li>
  </ul>
  <div class="review-list">
    <div class="main review-item" id="4931491">
      <header class="main-hd"><a class="avator"><img src="https://example.com/a.jpg"></a><a class="name" href="/people/a/">大头</a><span class="allstar40 main-title-rating" title="推荐"></span><span class="main-meta">2011-04-18</span></header>
      <div class="main-bd"><h2><a href="/review/4931491/">影评标题</a></h2><div class="review-short"><div class="short-content">正文摘要</div></div><div class="action"><a class="up">21</a><a class="down">3</a></div></div>
    </div>
  </div>`;

describe(mountSubjectReviews, () => {
  afterEach(() => vi.restoreAllMocks());

  it("waits for a just-arriving native directory instead of permanently abandoning the page", () => {
    const { cleanup, doc } = createTestDoc(
      '<title>权力的游戏 第一季的剧评 (677)</title><main id="content"></main><div id="wrapper"></div>',
      "/subject/3016187/reviews"
    );
    const callbacks: FrameRequestCallback[] = [];
    const view = doc.defaultView;
    if (!view) {
      throw new Error("expected test document window");
    }
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(view, "requestAnimationFrame").mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    /* eslint-enable promise/prefer-await-to-callbacks */
    const warning = vi.spyOn(console, "warn").mockImplementation(vi.fn());

    mountSubjectReviews(doc);

    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(callbacks).toHaveLength(1);
    expect(warning).not.toHaveBeenCalled();

    const content = doc.querySelector("#content");
    if (!content) {
      throw new Error("expected native content");
    }
    content.innerHTML = reviewDirectory;
    callbacks.shift()?.(0);

    expect(doc.querySelector("#atv-douban-root")).not.toBeNull();
    expect(warning).not.toHaveBeenCalled();
    cleanup();
  });
});
