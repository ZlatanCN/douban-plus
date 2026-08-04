import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SubjectReviewsPageData } from "@/modules/subject-reviews/domain";
import { SubjectReviewsPage } from "@/modules/subject-reviews/presentation/page";
import type { SubjectReviewsNavigationState } from "@/modules/subject-reviews/runtime/navigation";

import { createTestDoc, mockCookie } from "../../helpers/doc";

const data: SubjectReviewsPageData = {
  pagination: [],
  ratings: [
    {
      active: true,
      href: "https://movie.douban.com/subject/3016187/reviews?rating=",
      label: "全部",
      value: "",
    },
    {
      active: false,
      href: "https://movie.douban.com/subject/3016187/reviews?rating=5",
      label: "给5星的评论",
      value: "5",
    },
  ],
  reviewKind: "剧评",
  reviews: [
    {
      author: {
        avatar: null,
        href: "https://www.douban.com/people/a/",
        name: "大头",
      },
      content: "正文摘要",
      id: "4931491",
      ratingWord: "推荐",
      reply: null,
      spoiler: false,
      stars: 4,
      time: "2011-04-18",
      title: "影评标题",
      usefulCount: 21,
      uselessCount: 3,
    },
  ],
  sorts: [
    {
      active: true,
      href: "https://movie.douban.com/subject/3016187/reviews",
      label: "最受欢迎的",
      value: "hotest",
    },
    {
      active: false,
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
  ],
  subjectHref: "https://movie.douban.com/subject/3016187/",
  subjectId: "3016187",
  title: "权力的游戏 第一季",
  writeHref: "https://movie.douban.com/subject/3016187/new_review",
};

const navigation = (): SubjectReviewsNavigationState => ({
  data,
  dismissFailure: () => null,
  failure: null,
  navigate: () => null,
  pending: null,
  refresh: () => Promise.resolve(false),
  retry: () => null,
  version: 0,
});

describe(SubjectReviewsPage, () => {
  let root: HTMLElement | null = null;

  afterEach(() => {
    if (root) {
      render(null, root);
      root = null;
    }
  });

  it.each([
    {
      action: "筛选影评",
      selector: ".atv-subject-reviews-option[href*='sort=time']",
    },
    {
      action: "查看我关注的影评",
      selector: ".atv-subject-reviews-option[href*='sort=follow']",
    },
    {
      action: "筛选影评",
      selector: ".atv-subject-reviews-option[href*='rating=5']",
    },
  ])(
    "opens the login modal for the unauthenticated $selector filter",
    async ({ action, selector }) => {
      const { cleanup, doc } = createTestDoc(
        "<title>权力的游戏 第一季的剧评 (677)</title>",
        "/subject/3016187/reviews"
      );
      const clearCookie = mockCookie(doc, "");
      root = document.createElement("div");

      render(<SubjectReviewsPage doc={doc} navigation={navigation()} />, root);
      const filter = root.querySelector<HTMLAnchorElement>(selector);
      expect(filter).not.toBeNull();
      filter?.click();

      await vi.waitFor(() =>
        expect(root?.querySelector("#atv-login-modal-desc")?.textContent).toBe(
          `登录后才能${action}。`
        )
      );

      clearCookie();
      cleanup();
    }
  );
});
