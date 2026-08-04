import type { SubjectReviewsNavigationState } from "../runtime/navigation";

type PaginationNavProps = {
  nav: {
    prevHref: string | null;
    nextHref: string | null;
    prevLabel: string;
    nextLabel: string;
    hasIndicator: boolean;
    currentPageStr: string;
    totalPageStr: string;
    show: boolean;
  };
  locked: boolean;
  onNavigate: (href: string, label: string) => void;
};

type PaginationLink =
  SubjectReviewsNavigationState["data"]["pagination"][number];
const isNumericPageLabel = (label: string): boolean => /^\d+$/u.test(label);

const isPreviousPageLink = (item: PaginationLink): boolean =>
  item.label.startsWith("<") ||
  item.label.includes("上一页") ||
  item.label.includes("前一页") ||
  item.label.includes("«") ||
  item.label.includes("‹");

const isNextPageLink = (item: PaginationLink): boolean =>
  item.label.endsWith(">") ||
  item.label.includes("下一页") ||
  item.label.includes("后一页") ||
  item.label.includes("»") ||
  item.label.includes("›");

const computePageStep = (
  numericLinks: { href: string | null; label: string }[],
  doc: Document
): number => {
  if (numericLinks.length < 2) {
    return 20;
  }
  try {
    const [a, b] = numericLinks;
    if (!a || !b || !a.href || !b.href) {
      return 20;
    }
    const u1 = new URL(a.href, doc.location.href);
    const u2 = new URL(b.href, doc.location.href);
    const s1 = Number(u1.searchParams.get("start") || "0");
    const s2 = Number(u2.searchParams.get("start") || "0");
    const n1 = Number(a.label);
    const n2 = Number(b.label);
    return Math.round((s2 - s1) / (n2 - n1));
  } catch {
    return 20;
  }
};

const buildPaginationUrl = (
  numericLinks: { href: string | null }[],
  page: number,
  step: number,
  doc: Document
): string | null => {
  const [tmpl] = numericLinks;
  if (!tmpl?.href) {
    return null;
  }
  try {
    const url = new URL(tmpl.href, doc.location.href);
    url.searchParams.set("start", String((page - 1) * step));
    return url.href;
  } catch {
    return null;
  }
};

const getPaginationPageNumbers = (
  pageLinks: SubjectReviewsNavigationState["data"]["pagination"]
) => {
  const currentPage = pageLinks.find(
    (item) => isNumericPageLabel(item.label) && !item.href
  );
  const numericLinks = pageLinks.filter(
    (item) => isNumericPageLabel(item.label) && item.href
  );
  const totalPage = numericLinks.at(-1);
  return {
    currentPageLabel: currentPage?.label ?? "?",
    currentPageVal: currentPage ? Number(currentPage.label) : 0,
    hasIndicator: Boolean(currentPage || totalPage),
    maxPage: totalPage ? Number(totalPage.label) : 0,
    numericLinks,
    totalPageLabel: totalPage?.label ?? "?",
  };
};

const getPaginationNav = (
  pageLinks: SubjectReviewsNavigationState["data"]["pagination"],
  doc: Document
): PaginationNavProps["nav"] => {
  const prevItem = pageLinks.find(isPreviousPageLink) ?? null;
  const nextItem = pageLinks.find(isNextPageLink) ?? null;
  const {
    currentPageLabel,
    currentPageVal,
    hasIndicator,
    maxPage,
    numericLinks,
    totalPageLabel,
  } = getPaginationPageNumbers(pageLinks);
  const step = computePageStep(numericLinks, doc);
  const prevHref =
    prevItem?.href ??
    (currentPageVal > 1
      ? buildPaginationUrl(numericLinks, currentPageVal - 1, step, doc)
      : null);
  const nextHref =
    nextItem?.href ??
    (currentPageVal > 0 && currentPageVal < maxPage
      ? buildPaginationUrl(numericLinks, currentPageVal + 1, step, doc)
      : null);
  return {
    currentPageStr: currentPageLabel,
    hasIndicator,
    nextHref,
    nextLabel: nextItem?.label ?? "下一页",
    prevHref,
    prevLabel: prevItem?.label ?? "上一页",
    show: pageLinks.length > 0,
    totalPageStr: totalPageLabel,
  };
};

const PaginationNav = ({
  nav: {
    prevHref,
    nextHref,
    prevLabel,
    nextLabel,
    hasIndicator,
    currentPageStr,
    totalPageStr,
    show,
  },
  locked,
  onNavigate,
}: PaginationNavProps) => {
  if (!show) {
    return null;
  }
  return (
    <nav
      aria-label="影评分页"
      class="atv-subject-reviews-pagination is-condensed"
    >
      {prevHref ? (
        <a
          aria-label="上一页"
          class="atv-subject-reviews-pagination-prev"
          href={prevHref}
          onClick={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              locked
            ) {
              return;
            }
            event.preventDefault();
            onNavigate(prevHref, prevLabel);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 3L5 7L9 11"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
      ) : (
        <span class="atv-subject-reviews-pagination-prev atv-subject-reviews-pagination-disabled">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 3L5 7L9 11"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      )}
      {hasIndicator && (
        <span class="atv-subject-reviews-pagination-indicator">
          {currentPageStr}
          <span class="atv-subject-reviews-pagination-sep">/</span>
          {totalPageStr}
        </span>
      )}
      {nextHref ? (
        <a
          aria-label="下一页"
          class="atv-subject-reviews-pagination-next"
          href={nextHref}
          onClick={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              locked
            ) {
              return;
            }
            event.preventDefault();
            onNavigate(nextHref, nextLabel);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 3L9 7L5 11"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
      ) : (
        <span class="atv-subject-reviews-pagination-next atv-subject-reviews-pagination-disabled">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 3L9 7L5 11"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      )}
    </nav>
  );
};

export { PaginationNav, getPaginationNav };
export type { PaginationNavProps, PaginationLink };
