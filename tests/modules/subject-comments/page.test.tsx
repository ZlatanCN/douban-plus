import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SubjectCommentsPageData } from "@/modules/subject-comments/domain";
import { extractSubjectCommentsPage } from "@/modules/subject-comments/extract/page";
import { SubjectCommentsPage } from "@/modules/subject-comments/presentation/page";
import {
  isSubjectCommentsPage,
  mountSubjectComments,
} from "@/modules/subject-comments/runtime/mount";
import type { SubjectCommentsNavigationState } from "@/modules/subject-comments/runtime/navigation";

import { createTestDoc, mockCookie } from "../../helpers/doc";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = (() => null) as never;
});

const pageData: SubjectCommentsPageData = {
  comments: [
    {
      author: {
        avatar: "https://img3.doubanio.com/icon/u1.jpg",
        href: "https://www.douban.com/people/alice/",
        name: "Alice",
      },
      content: "这是一条完整短评，不应在总览页被截断或放进弹窗。",
      id: "1001",
      location: "北京",
      rating: 5,
      status: "看过",
      time: {
        href: "https://movie.douban.com/comment/1001/",
        label: "2026-07-28 10:00:00",
      },
      votes: {
        canVote: true,
        count: 42,
        requiresLogin: false,
        voted: false,
      },
    },
  ],
  pagination: [
    {
      active: true,
      href: null,
      label: "1",
      relation: "current",
    },
    {
      active: false,
      href: "https://movie.douban.com/subject/3016187/comments?start=20&limit=20&sort=new_score&status=P&percent_type=",
      label: "后页 >",
      relation: "next",
    },
  ],
  scoreFilters: [
    {
      active: true,
      href: "https://movie.douban.com/subject/3016187/comments?percent_type=&status=P",
      label: "全部",
      value: "",
    },
    {
      active: false,
      href: "https://movie.douban.com/subject/3016187/comments?percent_type=h&status=P",
      label: "好评",
      value: "h",
    },
    {
      active: false,
      href: "https://movie.douban.com/subject/3016187/comments?percent_type=m&status=P",
      label: "一般",
      value: "m",
    },
    {
      active: false,
      href: "https://movie.douban.com/subject/3016187/comments?percent_type=l&status=P",
      label: "差评",
      value: "l",
    },
  ],
  sorts: [
    {
      active: true,
      href: "https://movie.douban.com/subject/3016187/comments?status=P",
      label: "热门",
    },
    {
      active: false,
      href: "https://movie.douban.com/subject/3016187/comments?sort=time&status=P",
      label: "最新",
      requiresLogin: true,
    },
  ],
  statuses: [
    {
      active: true,
      count: 94_163,
      href: "https://movie.douban.com/subject/3016187/comments?status=P",
      label: "看过",
      value: "P",
    },
    {
      active: false,
      count: 3723,
      href: "https://movie.douban.com/subject/3016187/comments?status=N",
      label: "在看",
      value: "N",
    },
    {
      active: false,
      count: 3555,
      href: "https://movie.douban.com/subject/3016187/comments?status=F",
      label: "想看",
      value: "F",
    },
  ],
  subjectHref: "https://movie.douban.com/subject/3016187/",
  subjectId: "3016187",
  title: "权力的游戏 第一季",
  writeActionAvailable: true,
};

const nativePage = `
  <div id="wrapper"><main id="content">
    <h1>权力的游戏 第一季的短评</h1>
    <div class="article">
      <div class="Comments-hd">
        <ul class="CommentTabs">
          <li class="is-active"><span>看过(94163)</span></li>
          <li><a href="https://movie.douban.com/subject/3016187/comments?status=N">在看(3723)</a></li>
          <li><a href="https://movie.douban.com/subject/3016187/comments?status=F">想看(3555)</a></li>
        </ul>
        <a class="comment_btn j a_collect_btn" href="javascript:;">我来写短评</a>
      </div>
      <div class="title_line"><div class="Comments-sortby">
        <span>热门</span>
        <a class="j a_show_login" href="https://movie.douban.com/subject/3016187/comments?sort=time&status=P">最新</a>
      </div></div>
      <div class="comment-filter">
        <label><input checked type="radio" value=""><span>全部</span></label>
        <label><input type="radio" value="h"><span>好评</span></label>
        <label><input type="radio" value="m"><span>一般</span></label>
        <label><input type="radio" value="l"><span>差评</span></label>
      </div>
      <div id="comments">
        <div class="comment-item" data-cid="1001">
          <div class="avatar"><a href="https://www.douban.com/people/alice/"><img src="https://img3.doubanio.com/icon/u1.jpg"></a></div>
          <div class="comment"><h3>
            <span class="comment-vote"><span class="votes vote-count">42</span><input type="hidden" value="1001"><a class="j vote-comment" href="javascript:;">有用</a></span>
            <span class="comment-info"><a href="https://www.douban.com/people/alice/">Alice</a><span>看过</span><span class="allstar50 rating" title="力荐"></span><a class="comment-time" href="https://movie.douban.com/comment/1001/" title="2026-07-28 10:00:00">2026-07-28 10:00:00</a><span class="comment-location">北京</span></span>
          </h3><p class="comment-content"><span class="full">这是一条完整短评，不应在总览页被截断或放进弹窗。</span></p></div>
        </div>
      </div>
      <div id="paginator"><span data-page="current">1</span><a data-page="next" href="https://movie.douban.com/subject/3016187/comments?start=20&limit=20&sort=new_score&status=P&percent_type=">后页 &gt;</a></div>
    </div>
  </main></div>
`;

const loggedOutNativePage = nativePage.replace(
  '<a class="j vote-comment" href="javascript:;">有用</a>',
  '<a class="j a_show_login" href="javascript:;">有用</a>'
);

describe(extractSubjectCommentsPage, () => {
  it("extracts the complete native reading state and interaction exits", () => {
    const { cleanup, doc } = createTestDoc(
      nativePage,
      "/subject/3016187/comments"
    );

    expect(extractSubjectCommentsPage(doc)).toStrictEqual(pageData);

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
    const fallback = createTestDoc(
      '<main id="content"><h1>作品甲的短评</h1></main>',
      "/subject/123/comments"
    );

    mountSubjectComments(ready.doc);
    mountSubjectComments(fallback.doc);

    expect(ready.doc.body.classList).toContain("atv-enhanced");
    expect(ready.doc.querySelector("#atv-douban-root h1")?.textContent).toBe(
      "权力的游戏 第一季"
    );
    expect(fallback.doc.body.classList).not.toContain("atv-enhanced");
    expect(fallback.doc.querySelector("#atv-douban-root")).toBeNull();

    ready.cleanup();
    fallback.cleanup();
  });
});
