import { $$, safeText } from "@/shared/utils/dom";

import type {
  SubjectComment,
  SubjectCommentStatus,
  SubjectCommentVotes,
  SubjectCommentsBrowseOption,
  SubjectCommentsPageData,
  SubjectCommentsPaginationLink,
  SubjectCommentsScoreFilter,
} from "../domain";

const MOVIE_ORIGIN = "https://movie.douban.com";

const subjectIdFromPath = (pathname: string): string | null =>
  pathname.match(/^\/subject\/(?<id>\d+)\/comments\/?$/u)?.groups?.id ?? null;

const sourceUrl = (doc: Document, pageHref: string): URL => {
  const url = new URL(pageHref, MOVIE_ORIGIN);
  if (subjectIdFromPath(url.pathname)) {
    return url;
  }
  const location = doc.defaultView?.location ?? doc.location;
  return new URL(`${location.pathname}${location.search}`, MOVIE_ORIGIN);
};

const titleFromHeading = (heading: string): string =>
  heading.replace(/\s*的?短评\s*$/u, "").trim();

const absoluteHref = (element: HTMLAnchorElement, baseHref: string): string => {
  const href = element.getAttribute("href")?.trim();
  if (!href) {
    return element.href;
  }
  return new URL(href, baseHref).href;
};

const commentsHref = (
  pageHref: string,
  subjectId: string,
  parameters: Readonly<Record<string, string>>
): string => {
  const path = `/subject/${subjectId}/comments`;
  let url = new URL(path, MOVIE_ORIGIN);
  try {
    const current = new URL(pageHref);
    if (current.origin === MOVIE_ORIGIN && current.pathname === path) {
      url = current;
    }
  } catch {
    // Fall back to the canonical comments URL for detached test documents.
  }
  url.searchParams.delete("start");
  url.searchParams.delete("limit");
  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }
  return url.href;
};

const countFromLabel = (label: string): number | null => {
  const match = label.match(/\((?<count>[\d,]+)\)\s*$/u)?.groups?.count;
  if (!match) {
    return null;
  }

  const count = Number(match.replaceAll(",", ""));
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
};

const statusFromItem = (
  item: Element,
  pageHref: string,
  subjectId: string,
  activeStatus: string
): SubjectCommentStatus | null => {
  const rawLabel = safeText(item);
  const count = countFromLabel(rawLabel);
  const label = rawLabel.replace(/\s*\([\d,]+\)\s*$/u, "").trim();
  const link = item.querySelector<HTMLAnchorElement>("a[href]");
  const linkHref = link ? absoluteHref(link, pageHref) : null;
  const active = item.classList.contains("is-active");
  const value =
    linkHref?.match(/[?&]status=(?<status>[A-Z])/u)?.groups?.status ??
    (active ? activeStatus : "");
  if (!label || count === null || !value) {
    return null;
  }

  return {
    active,
    count,
    href: commentsHref(pageHref, subjectId, { status: value }),
    label,
    value,
  };
};

const extractStatuses = (
  doc: Document,
  subjectId: string,
  pageHref: string
): SubjectCommentStatus[] | null => {
  const activeStatus = (() => {
    try {
      const status = new URL(pageHref).searchParams.get("status");
      return status && /^[PNF]$/u.test(status) ? status : "P";
    } catch {
      return "P";
    }
  })();
  const statuses = $$<HTMLElement>(".CommentTabs > li", doc).flatMap((item) => {
    const status = statusFromItem(item, pageHref, subjectId, activeStatus);
    return status ? [status] : [];
  });

  return statuses.length === 3 && statuses.some((status) => status.active)
    ? statuses
    : null;
};

const currentStatus = (statuses: readonly SubjectCommentStatus[]): string =>
  statuses.find((status) => status.active)?.value ?? "P";

const extractSorts = (
  doc: Document,
  subjectId: string,
  status: string,
  pageHref: string
): SubjectCommentsBrowseOption[] =>
  (() => {
    const items = $$<HTMLElement>(
      ".Comments-sortby > span, .Comments-sortby > a",
      doc
    );
    return items.length > 0
      ? items
      : $$<HTMLElement>(".title_line span, .title_line a", doc);
  })().flatMap((item) => {
    const label = safeText(item);
    if (!label) {
      return [];
    }
    const link = item instanceof HTMLAnchorElement ? item : null;
    const sort = link
      ? new URL(absoluteHref(link, pageHref)).searchParams.get("sort")
      : null;
    return [
      {
        active: !link,
        href: commentsHref(pageHref, subjectId, {
          ...(sort ? { sort } : {}),
          status,
        }),
        label,
        ...(link
          ? { requiresLogin: link.classList.contains("a_show_login") }
          : {}),
      },
    ];
  });

const extractScoreFilters = (
  doc: Document,
  subjectId: string,
  status: string,
  pageHref: string
): SubjectCommentsScoreFilter[] =>
  $$<HTMLInputElement>(".comment-filter input[type=radio]", doc).flatMap(
    (input) => {
      const label = safeText(input.closest("label"));
      if (!label) {
        return [];
      }
      return [
        {
          active: input.checked,
          href: commentsHref(pageHref, subjectId, {
            percent_type: input.value,
            status,
          }),
          label,
          value: input.value,
        },
      ];
    }
  );

const ratingFromComment = (comment: Element): number | null => {
  const className =
    comment.querySelector(".comment-info .rating")?.className ?? "";
  const rating = className.match(/allstar(?<rating>[1-5])0/u)?.groups?.rating;
  return rating ? Number(rating) : null;
};

const votesFromComment = (item: Element): SubjectCommentVotes => {
  const canVote = item.querySelector(".vote-comment") !== null;
  const count = Number(safeText(item.querySelector(".vote-count")));
  return {
    canVote,
    count: Number.isSafeInteger(count) && count >= 0 ? count : 0,
    requiresLogin:
      !canVote && item.querySelector(".comment-vote .a_show_login") !== null,
    voted:
      !canVote &&
      /已投票|已赞|已推荐/u.test(safeText(item.querySelector(".comment-vote"))),
  };
};

const extractComment = (
  item: HTMLElement,
  pageHref: string
): SubjectComment | null => {
  const id = item.dataset.cid?.trim();
  const commentInfo = item.querySelector(".comment-info");
  const authorLink = commentInfo?.querySelector<HTMLAnchorElement>("a[href]");
  const content = safeText(
    item.querySelector(".comment-content .full, .comment-content .short")
  );
  const author = safeText(authorLink);
  if (!id || !commentInfo || !author || !content) {
    return null;
  }

  const status = $$<HTMLElement>(":scope > span", commentInfo).find(
    (span) =>
      !span.classList.contains("rating") &&
      !span.classList.contains("comment-location")
  );
  const time = commentInfo.querySelector<HTMLElement>(".comment-time");
  const location = safeText(commentInfo.querySelector(".comment-location"));
  const avatar = item.querySelector<HTMLImageElement>(".avatar img[src]");

  return {
    author: {
      avatar: avatar?.currentSrc || avatar?.src || null,
      href: authorLink ? absoluteHref(authorLink, pageHref) : null,
      name: author,
    },
    content,
    id,
    location: location || null,
    rating: ratingFromComment(item),
    status: safeText(status) || null,
    time: time
      ? {
          href:
            time instanceof HTMLAnchorElement
              ? absoluteHref(time, pageHref)
              : null,
          label: time.title || safeText(time),
        }
      : null,
    votes: votesFromComment(item),
  };
};

const extractPagination = (
  doc: Document,
  pageHref: string
): SubjectCommentsPaginationLink[] =>
  $$<HTMLElement>("#paginator > a, #paginator > span", doc).flatMap((item) => {
    const label = safeText(item);
    return label
      ? [
          {
            active: !(item instanceof HTMLAnchorElement),
            href:
              item instanceof HTMLAnchorElement
                ? absoluteHref(item, pageHref)
                : null,
            label,
            relation: item.dataset.page ?? null,
          },
        ]
      : [];
  });

const extractSubjectCommentsPage = (
  doc: Document,
  pageHref = doc.defaultView?.location.href ?? doc.location.href
): SubjectCommentsPageData | null => {
  const pageUrl = sourceUrl(doc, pageHref);
  const subjectId = subjectIdFromPath(pageUrl.pathname);
  const title = titleFromHeading(safeText(doc.querySelector("#content h1")));
  if (!subjectId || !title) {
    return null;
  }

  const statuses = extractStatuses(doc, subjectId, pageUrl.href);
  if (!statuses) {
    return null;
  }

  const comments: SubjectComment[] = [];
  for (const item of $$<HTMLElement>("#comments > .comment-item", doc)) {
    const comment = extractComment(item, pageUrl.href);
    if (!comment) {
      return null;
    }
    comments.push(comment);
  }
  if (comments.length === 0) {
    return null;
  }

  const status = currentStatus(statuses);
  const sorts = extractSorts(doc, subjectId, status, pageUrl.href);
  if (sorts.length === 0) {
    return null;
  }
  return {
    comments,
    pagination: extractPagination(doc, pageUrl.href),
    scoreFilters: extractScoreFilters(doc, subjectId, status, pageUrl.href),
    sorts,
    statuses,
    subjectHref: `https://movie.douban.com/subject/${subjectId}/`,
    subjectId,
    title,
    writeActionAvailable:
      doc.querySelector(".a_collect_btn, .comment_btn.j") !== null,
  };
};

export { extractSubjectCommentsPage, subjectIdFromPath };
