import type { SubjectCommentsPageData } from "@/modules/subject-comments/domain";

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

const nativePageWithoutWatchingStatus = nativePage.replace(
  '          <li><a href="https://movie.douban.com/subject/3016187/comments?status=N">在看(3723)</a></li>\n',
  ""
);

export {
  loggedOutNativePage,
  nativePage,
  nativePageWithoutWatchingStatus,
  pageData,
};
