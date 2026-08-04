import { $$, safeText } from "@/shared/utils/dom";

import type {
  SubjectReview,
  SubjectReviewsBrowseOption,
  SubjectReviewsPageData,
  SubjectReviewsPaginationLink,
} from "../domain";

type SubjectReviewsExtractionDiagnostics = {
  activeSortCount: number;
  heading: string;
  invalidReviewIndex: number | null;
  listPresent: boolean;
  ratingCount: number;
  reviewCount: number;
  reviewKind: "影评" | "剧评" | null;
  sortCount: number;
  subjectId: string | null;
  writePresent: boolean;
};

const MOVIE_ORIGIN = "https://movie.douban.com";

const subjectIdFromPath = (pathname: string): string | null =>
  pathname.match(/^\/subject\/(?<id>\d+)\/reviews\/?$/u)?.groups?.id ?? null;

const absoluteHref = (element: HTMLAnchorElement, baseHref: string): string =>
  new URL(element.getAttribute("href") || element.href, baseHref).href;

const sourceUrl = (doc: Document, pageHref: string): URL => {
  const supplied = new URL(pageHref, MOVIE_ORIGIN);
  if (subjectIdFromPath(supplied.pathname)) {
    return supplied;
  }
  const location = doc.defaultView?.location ?? doc.location;
  return new URL(`${location.pathname}${location.search}`, MOVIE_ORIGIN);
};

const reviewsHref = (
  pageHref: string,
  subjectId: string,
  parameters: Readonly<Record<string, string>>
): string => {
  const canonical = new URL(`/subject/${subjectId}/reviews`, MOVIE_ORIGIN);
  let url = canonical;
  try {
    const current = new URL(pageHref);
    if (
      current.origin === MOVIE_ORIGIN &&
      current.pathname === canonical.pathname
    ) {
      url = current;
    }
  } catch {
    // Detached test documents use the canonical directory URL.
  }
  url.searchParams.delete("start");
  url.searchParams.delete("sort");
  url.searchParams.delete("rating");
  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }
  return url.href;
};

const reviewKindFromHeading = (heading: string): "影评" | "剧评" | null => {
  if (heading.includes("剧评")) {
    return "剧评";
  }
  if (heading.includes("影评")) {
    return "影评";
  }
  return null;
};

const titleFromHeading = (heading: string, reviewKind: string): string =>
  heading
    .replace(
      new RegExp(`\\s*的?(?:[1-5]星)?${reviewKind}\\s*\\(.*\\)\\s*$`, "u"),
      ""
    )
    .trim();

const optionLabel = (label: string): string =>
  label.replace(/\s*\([\d,]+\)\s*$/u, "").trim();

const defaultSorts = [
  { label: "最受欢迎的", value: "hotest" },
  { label: "最新发布的", value: "time" },
  { label: "我关注的", value: "follow" },
] as const;

const defaultRatings = ["", "5", "4", "3", "2", "1"] as const;

const extractSorts = (
  doc: Document,
  pageHref: string,
  subjectId: string
): SubjectReviewsBrowseOption[] => {
  const current = new URL(pageHref, MOVIE_ORIGIN);
  const rating = current.searchParams.get("rating");
  const currentSort = current.searchParams.get("sort") || "hotest";
  const nativeSorts = $$<HTMLAnchorElement>(".top-tab > li > a", doc)
    .filter((link) => {
      const item = link.parentElement;
      return !(
        link.classList.contains("dropdown") ||
        link.classList.contains("create-review") ||
        item?.classList.contains("dropdown") ||
        item?.classList.contains("create-review")
      );
    })
    .flatMap((link) => {
      const label = safeText(link);
      const linkedSort = new URL(absoluteHref(link, pageHref)).searchParams.get(
        "sort"
      );
      const selected =
        link.parentElement?.classList.contains("selected") ?? false;
      const sort = selected ? currentSort : linkedSort || "hotest";
      const active = selected || sort === currentSort;
      if (!label || !sort) {
        return [];
      }
      return [
        {
          active,
          href: reviewsHref(pageHref, subjectId, {
            ...(rating === null ? {} : { rating }),
            ...(sort === "hotest" ? {} : { sort }),
          }),
          label,
          value: sort,
        },
      ];
    });
  if (
    nativeSorts.length === defaultSorts.length &&
    nativeSorts.some((sort) => sort.active)
  ) {
    return nativeSorts;
  }
  return defaultSorts.map(({ label, value }) => ({
    active: value === currentSort,
    href: reviewsHref(pageHref, subjectId, {
      ...(rating === null ? {} : { rating }),
      ...(value === "hotest" ? {} : { sort: value }),
    }),
    label,
    value,
  }));
};

const extractRatings = (
  doc: Document,
  pageHref: string,
  subjectId: string
): SubjectReviewsBrowseOption[] => {
  const current = new URL(pageHref, MOVIE_ORIGIN);
  const sort = current.searchParams.get("sort");
  const activeRating = current.searchParams.get("rating") ?? "";
  const nativeRatings = $$<HTMLAnchorElement>(".droplist a", doc).flatMap(
    (link) => {
      const rawLabel = safeText(link);
      const value = new URL(absoluteHref(link, pageHref)).searchParams.get(
        "rating"
      );
      if (rawLabel && value !== null) {
        return [
          {
            active: value === activeRating,
            href: reviewsHref(pageHref, subjectId, {
              rating: value,
              ...(sort && sort !== "hotest" ? { sort } : {}),
            }),
            label: optionLabel(rawLabel),
            value,
          },
        ];
      }
      return [];
    }
  );
  if (nativeRatings.length > 0) {
    return nativeRatings;
  }
  return defaultRatings.map((value) => ({
    active: value === activeRating,
    href: reviewsHref(pageHref, subjectId, {
      rating: value,
      ...(sort && sort !== "hotest" ? { sort } : {}),
    }),
    label: value ? `给${value}星的评论` : "全部",
    value,
  }));
};

const starsFromClassName = (className: string): number => {
  const value = className.match(/allstar(?<stars>[1-5])0/u)?.groups?.stars;
  return value ? Number(value) : 0;
};

const numberFromText = (element: Element | null): number => {
  const value = Number(safeText(element).replaceAll(",", ""));
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
};

const reviewPreview = (item: HTMLElement): string => {
  const preview = item.querySelector<HTMLElement>(
    ".review-short .short-content"
  );
  const previewCopy = preview?.cloneNode(true) as HTMLElement | undefined;
  previewCopy?.querySelector(".spoiler-tip")?.remove();
  previewCopy?.querySelector(".unfold")?.remove();
  return safeText(previewCopy || item.querySelector(".main-bd"));
};

const extractReview = (
  item: HTMLElement,
  pageHref: string
): SubjectReview | null => {
  const authorLink = item.querySelector<HTMLAnchorElement>(
    ".main-hd .name[href]"
  );
  const titleLink = item.querySelector<HTMLAnchorElement>(
    ".main-bd h2 a[href]"
  );
  const name = safeText(authorLink);
  const title = safeText(titleLink);
  const id = item.id.trim() || item.dataset.rid?.trim() || "";
  if (!authorLink || !titleLink || !name || !title || !id) {
    return null;
  }
  const avatar = item.querySelector<HTMLImageElement>(
    ".main-hd .avator img[src]"
  );
  const reply = item.querySelector<HTMLAnchorElement>(".action .reply[href]");
  const rating = item.querySelector<HTMLElement>(
    ".main-title-rating, [class*='allstar']"
  );
  return {
    author: {
      avatar: avatar?.currentSrc || avatar?.src || null,
      href: absoluteHref(authorLink, pageHref),
      name,
    },
    content: reviewPreview(item),
    id,
    ratingWord: rating?.getAttribute("title") || "",
    reply: reply
      ? { href: absoluteHref(reply, pageHref), label: safeText(reply) }
      : null,
    spoiler: item.querySelector(".spoiler-tip") !== null,
    stars: starsFromClassName(rating?.className || ""),
    time: safeText(item.querySelector(".main-hd .main-meta")),
    title,
    usefulCount: numberFromText(item.querySelector(".action .up")),
    uselessCount: numberFromText(item.querySelector(".action .down")),
  };
};

const extractPagination = (
  doc: Document,
  pageHref: string
): SubjectReviewsPaginationLink[] =>
  $$<HTMLElement>(".paginator > a, .paginator > span", doc).flatMap((item) => {
    const label = safeText(item);
    if (!label) {
      return [];
    }
    return [
      {
        active: !(item instanceof HTMLAnchorElement),
        href:
          item instanceof HTMLAnchorElement
            ? absoluteHref(item, pageHref)
            : null,
        label,
      },
    ];
  });

const diagnoseSubjectReviewsPage = (
  doc: Document,
  pageHref = doc.defaultView?.location.href ?? doc.location.href
): SubjectReviewsExtractionDiagnostics => {
  const pageUrl = sourceUrl(doc, pageHref);
  const subjectId = subjectIdFromPath(pageUrl.pathname);
  const heading = safeText(doc.querySelector("#content h1, h1")) || doc.title;
  const reviewKind = reviewKindFromHeading(heading);
  const write = doc.querySelector<HTMLAnchorElement>(".create-review[href]");
  const sorts = subjectId ? extractSorts(doc, pageUrl.href, subjectId) : [];
  const ratings = subjectId ? extractRatings(doc, pageUrl.href, subjectId) : [];
  const list = doc.querySelector(".review-list");
  const reviews = $$<HTMLElement>(".review-list .review-item", doc);
  const invalidReviewIndex = subjectId
    ? reviews.findIndex((item) => extractReview(item, pageUrl.href) === null)
    : -1;

  return {
    activeSortCount: sorts.filter((sort) => sort.active).length,
    heading,
    invalidReviewIndex: invalidReviewIndex === -1 ? null : invalidReviewIndex,
    listPresent: list !== null,
    ratingCount: ratings.length,
    reviewCount: reviews.length,
    reviewKind,
    sortCount: sorts.length,
    subjectId,
    writePresent: write !== null,
  };
};

const extractSubjectReviewsPage = (
  doc: Document,
  pageHref = doc.defaultView?.location.href ?? doc.location.href
): SubjectReviewsPageData | null => {
  const pageUrl = sourceUrl(doc, pageHref);
  const subjectId = subjectIdFromPath(pageUrl.pathname);
  const heading = safeText(doc.querySelector("#content h1, h1")) || doc.title;
  const reviewKind = reviewKindFromHeading(heading);
  const write = doc.querySelector<HTMLAnchorElement>(".create-review[href]");
  if (!subjectId || !reviewKind) {
    return null;
  }
  const sorts = extractSorts(doc, pageUrl.href, subjectId);
  const ratings = extractRatings(doc, pageUrl.href, subjectId);
  const list = doc.querySelector(".review-list");
  if (
    !list ||
    sorts.length !== 3 ||
    !sorts.some((sort) => sort.active) ||
    ratings.length === 0
  ) {
    return null;
  }
  const reviews: SubjectReview[] = [];
  for (const item of $$<HTMLElement>(".review-list .review-item", doc)) {
    const review = extractReview(item, pageUrl.href);
    if (!review) {
      return null;
    }
    reviews.push(review);
  }
  return {
    pagination: extractPagination(doc, pageUrl.href),
    ratings,
    reviewKind,
    reviews,
    sorts,
    subjectHref: `${MOVIE_ORIGIN}/subject/${subjectId}/`,
    subjectId,
    title: titleFromHeading(heading, reviewKind),
    writeHref: write
      ? absoluteHref(write, pageUrl.href)
      : `${MOVIE_ORIGIN}/subject/${subjectId}/new_review`,
  };
};

export {
  diagnoseSubjectReviewsPage,
  extractSubjectReviewsPage,
  reviewsHref,
  subjectIdFromPath,
};
export type { SubjectReviewsExtractionDiagnostics };
