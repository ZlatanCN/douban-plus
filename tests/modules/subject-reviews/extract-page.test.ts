import { describe, expect, it } from "vitest";

import { extractSubjectReviewsPage } from "@/modules/subject-reviews/extract/page";

const reviewDocument = (
  body: string,
  title = "权力的游戏 第一季的剧评 (677)"
): Document =>
  new DOMParser().parseFromString(
    `<title>${title}</title><main id="content">${body}</main>`,
    "text/html"
  );

describe(extractSubjectReviewsPage, () => {
  it("turns a native review directory into a complete, navigable reader directory", () => {
    const data = extractSubjectReviewsPage(
      reviewDocument(`
        <ul class="top-tab">
          <li class="selected"><a href="javascript:;">最受欢迎的</a></li>
          <li><a href="?sort=time">最新发布的</a></li>
          <li><a href="?sort=follow">我关注的</a></li>
          <li class="dropdown"><a href="javascript:;">按评星查看</a><ul class="droplist"><li><a href="?rating=">全部 (677)</a></li><li><a href="?rating=5">给5星的评论 (395)</a></li></ul></li>
          <li><a class="create-review" href="/subject/3016187/new_review">我来写评论</a></li>
        </ul>
        <div class="review-list">
          <div class="main review-item" id="4931491">
            <header class="main-hd"><a class="avator"><img src="https://example.com/a.jpg"></a><a class="name" href="/people/a/">大头</a><span class="allstar40 main-title-rating" title="推荐"></span><span class="main-meta">2011-04-18 12:00:00</span></header>
            <div class="main-bd"><h2><a href="/review/4931491/">有剧透的标题</a></h2><div class="review-short"><div class="short-content"><p class="spoiler-tip">这篇剧评可能有剧透</p>正文摘要 <a class="unfold">展开</a></div></div><div class="action"><a class="action-btn up">21</a><a class="action-btn down">3</a><a class="reply" href="/review/4931491/#comments">4回应</a></div></div>
          </div>
        </div>
        <div class="paginator"><span class="thispage">1</span><a href="?sort=hotest&start=20">2</a></div>
      `),
      "https://movie.douban.com/subject/3016187/reviews"
    );

    expect(data).toMatchObject({
      reviewKind: "剧评",
      reviews: [
        {
          id: "4931491",
          reply: { label: "4回应" },
          spoiler: true,
          usefulCount: 21,
          uselessCount: 3,
        },
      ],
      subjectId: "3016187",
      title: "权力的游戏 第一季",
    });
    expect(
      data?.sorts.map(({ active, label }) => ({ active, label }))
    ).toStrictEqual([
      { active: true, label: "最受欢迎的" },
      { active: false, label: "最新发布的" },
      { active: false, label: "我关注的" },
    ]);
    expect(data?.ratings[1]?.href).toBe(
      "https://movie.douban.com/subject/3016187/reviews?rating=5"
    );
    expect(data?.writeHref).toBe(
      "https://movie.douban.com/subject/3016187/new_review"
    );
  });

  it("keeps an unauthenticated directory mountable when Douban omits browse controls", () => {
    const data = extractSubjectReviewsPage(
      reviewDocument(`
        <ul class="top-tab">
          <li class="selected"><a href="javascript:;">最受欢迎的</a></li>
        </ul>
        <div class="review-list">
          <div class="main review-item" id="4931491">
            <header class="main-hd"><a class="name" href="/people/a/">大头</a><span class="allstar40 main-title-rating" title="推荐"></span><span class="main-meta">2011-04-18</span></header>
            <div class="main-bd"><h2><a href="/review/4931491/">未登录也可阅读</a></h2><div class="review-short"><div class="short-content">正文摘要</div></div></div>
          </div>
        </div>
      `),
      "https://movie.douban.com/subject/3016187/reviews"
    );

    expect(data).not.toBeNull();
    expect(
      data?.sorts.map(({ label, value }) => ({ label, value }))
    ).toStrictEqual([
      { label: "最受欢迎的", value: "hotest" },
      { label: "最新发布的", value: "time" },
      { label: "我关注的", value: "follow" },
    ]);
    expect(
      data?.ratings.map(({ label, value }) => ({ label, value }))
    ).toStrictEqual([
      { label: "全部", value: "" },
      { label: "给5星的评论", value: "5" },
      { label: "给4星的评论", value: "4" },
      { label: "给3星的评论", value: "3" },
      { label: "给2星的评论", value: "2" },
      { label: "给1星的评论", value: "1" },
    ]);
    expect(data?.writeHref).toBe(
      "https://movie.douban.com/subject/3016187/new_review"
    );
  });

  it.each(["1", "2", "3", "4", "5"])(
    "accepts the native %s-star directory, whose sort tab has no selected class",
    (rating) => {
      const data = extractSubjectReviewsPage(
        reviewDocument(
          `
          <ul class="top-tab">
            <li><a href="?sort=hotest">最受欢迎的</a></li>
            <li><a href="?sort=time">最新发布的</a></li>
            <li><a href="?sort=follow">我关注的</a></li>
            <li class="dropdown"><a href="javascript:;">给${rating}星的评论</a><ul class="droplist"><li><a href="?rating=">全部 (395)</a></li><li><a href="?rating=${rating}">给${rating}星的评论 (395)</a></li></ul></li>
            <li><a class="create-review" href="/subject/3016187/new_review">我来写评论</a></li>
          </ul>
          <div class="review-list">
            <div class="main review-item" id="4931491">
              <header class="main-hd"><a class="avator"><img src="https://example.com/a.jpg"></a><a class="name" href="/people/a/">大头</a><span class="allstar${rating}0 main-title-rating" title="推荐"></span><span class="main-meta">2011-04-18 12:00:00</span></header>
              <div class="main-bd"><h2><a href="/review/4931491/">评分目录中的标题</a></h2><div class="review-short"><div class="short-content">正文摘要</div></div><div class="action"><a class="action-btn up">21</a><a class="action-btn down">3</a><a class="reply" href="/review/4931491/#comments">4回应</a></div></div>
            </div>
          </div>
        `,
          `权力的游戏 第一季的${rating}星剧评 (395)`
        ),
        `https://movie.douban.com/subject/3016187/reviews?rating=${rating}`
      );

      expect(data).toMatchObject({
        sorts: [
          { active: true, value: "hotest" },
          { active: false, value: "time" },
          { active: false, value: "follow" },
        ],
        title: "权力的游戏 第一季",
      });
      expect(
        data?.ratings.find((option) => option.value === rating)?.active
      ).toBeTruthy();
    }
  );

  it("uses the current URL for a selected non-default sort with a javascript href", () => {
    const data = extractSubjectReviewsPage(
      reviewDocument(
        `
          <ul class="top-tab">
            <li><a href="?sort=hotest">最受欢迎的</a></li>
            <li class="selected"><a href="javascript:;">最新发布的</a></li>
            <li><a href="?sort=follow">我关注的</a></li>
            <li class="dropdown"><a href="javascript:;">按评星查看</a><ul class="droplist"><li><a href="?rating=">全部 (677)</a></li></ul></li>
            <li><a class="create-review" href="/subject/3016187/new_review">我来写评论</a></li>
          </ul>
          <div class="review-list">
            <div class="main review-item" id="4931491">
              <header class="main-hd"><a class="avator"><img src="https://example.com/a.jpg"></a><a class="name" href="/people/a/">大头</a><span class="allstar40 main-title-rating" title="推荐"></span><span class="main-meta">2011-04-18</span></header>
              <div class="main-bd"><h2><a href="/review/4931491/">最新影评</a></h2><div class="review-short"><div class="short-content">正文摘要</div></div><div class="action"><a class="up">21</a><a class="down">3</a></div></div>
            </div>
          </div>
        `
      ),
      "https://movie.douban.com/subject/3016187/reviews?sort=time"
    );

    expect(data?.sorts).toStrictEqual([
      {
        active: false,
        href: "https://movie.douban.com/subject/3016187/reviews",
        label: "最受欢迎的",
        value: "hotest",
      },
      {
        active: true,
        href: "https://movie.douban.com/subject/3016187/reviews?sort=time",
        label: "最新发布的",
        value: "time",
      },
      {
        active: false,
        href: "https://movie.douban.com/subject/3016187/reviews?sort=follow",
        label: "我关注的",
        value: "follow",
      },
    ]);
  });
});
