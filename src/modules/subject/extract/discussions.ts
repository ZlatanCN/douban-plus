import type {
  DiscussionActivity,
  DiscussionAuthor,
  DiscussionCollectionLink,
  DiscussionData,
  DiscussionTopic,
} from "@/modules/subject/domain";
import { $$, safeText } from "@/shared/utils/dom";

const MAX_DISCUSSION_TOPICS = 10;
const DOUBAN_ORIGIN = "https://www.douban.com/";

/* ── URL pattern constants ───────────────────────────── */

const TOPIC_PATH =
  /^\/(?:group\/topic\/\d+|subject\/\d+\/discussion\/\d+)\/?$/u;

const DISCUSSION_COLLECTION_PATH = /^\/subject\/\d+\/discussion\/?$/u;
const COLLECTION_PATH = /^\/(?:group\/\d+|subject\/\d+\/discussion)\/?$/u;

const START_DISCUSSION_PATH =
  /^\/(?:group\/\d+|subject\/\d+\/discussion\/create|register)\/?$/u;

const AUTHOR_PROFILE_PATH = /^\/people\/[^/]+\/?$/u;

const DISCUSSION_TIMESTAMP =
  /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2})(?::(?<seconds>\d{2}))?$/u;

/* ── URL helpers ─────────────────────────────────────── */

const isTrackingParameter = (fragment: string): boolean => {
  const [rawKey] = fragment.split("=", 1);
  if (rawKey === undefined) {
    return false;
  }
  try {
    return decodeURIComponent(rawKey.replaceAll("+", " ")) === "_spm_id";
  } catch {
    return false;
  }
};

const removeTrackingParameter = (search: string): string => {
  if (!search) {
    return "";
  }
  const remaining = search
    .slice(1)
    .split("&")
    .filter((fragment) => !isTrackingParameter(fragment));
  return remaining.length ? `?${remaining.join("&")}` : "";
};

const toSafeDoubanUrl = (rawHref: string): URL | undefined => {
  try {
    const url = new URL(rawHref, DOUBAN_ORIGIN);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname.endsWith(".douban.com") ||
      url.port ||
      url.username ||
      url.password
    ) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
};

const normalizeTopicHref = (rawHref: string): string => {
  const url = toSafeDoubanUrl(rawHref);
  if (!url || !TOPIC_PATH.test(url.pathname)) {
    return "";
  }
  const search = removeTrackingParameter(url.search);
  return `${url.origin}${url.pathname}${search}${url.hash}`;
};

const normalizeDoubanHref = (rawHref: string, path: RegExp): string => {
  const url = toSafeDoubanUrl(rawHref);
  return url && path.test(url.pathname) ? url.href : "";
};

/* ── Row-level extractors ────────────────────────────── */

const extractAuthor = (
  authorCell: HTMLTableCellElement | undefined
): DiscussionAuthor | undefined => {
  const link = authorCell?.querySelector<HTMLAnchorElement>("a");
  const name = safeText(link ?? authorCell).replace(/^来自\s*/u, "");
  if (!name) {
    return undefined;
  }
  const rawHref = link?.getAttribute("href")?.trim() ?? "";
  const href = rawHref ? normalizeDoubanHref(rawHref, AUTHOR_PROFILE_PATH) : "";
  return href ? { href, name } : { name };
};

const extractReplies = (
  repliesCell: HTMLTableCellElement | undefined
): number | undefined => {
  if (!repliesCell) {
    return undefined;
  }
  const text = safeText(repliesCell);
  if (!text) {
    return 0;
  }
  /* Try "N 回应" format (小组讨论 / 讨论区 Type 2), then bare number (讨论区 Type 1) */
  const match = /^(?<replies>\d+)\s*回应$/u.exec(text);
  if (match?.groups) {
    return Number(match.groups.replies);
  }
  const bare = Number(text);
  return Number.isSafeInteger(bare) ? bare : undefined;
};

const isValidDiscussionTimestamp = (dateTime: string): boolean => {
  const value = new Date(`${dateTime}Z`);
  return (
    !Number.isNaN(value.getTime()) &&
    value.toISOString().slice(0, dateTime.length) === dateTime
  );
};

const extractActivity = (
  activityCell: HTMLTableCellElement | undefined
): DiscussionActivity | undefined => {
  const raw = safeText(activityCell);
  if (!raw) {
    return undefined;
  }
  const match = DISCUSSION_TIMESTAMP.exec(raw);
  if (!match?.groups) {
    return { raw };
  }
  const { date, seconds, time } = match.groups;
  if (!date || !time) {
    return { raw };
  }
  const dateTime = `${date}T${time}${seconds ? `:${seconds}` : ""}`;
  return isValidDiscussionTimestamp(dateTime)
    ? { date, dateTime, raw, time }
    : { raw };
};

/* ── Container-level extractors ──────────────────────── */

/**
 * Extract topics from any table within a discussion container.
 * <thead> rows are naturally skipped (first cell has no topic link).
 */
const extractTopics = (container: Element): DiscussionTopic[] => {
  const topics: DiscussionTopic[] = [];
  for (const row of $$<HTMLTableRowElement>("table tr", container)) {
    /* Skip rows inside the hidden hot-discussion list (讨论区 Type 1) */
    if (row.closest(".mv-hot-discussion-list")) {
      continue;
    }
    const link = row.cells[0]?.querySelector<HTMLAnchorElement>("a");
    const title = safeText(link);
    const rawHref = link?.getAttribute("href")?.trim() ?? "";
    const href = rawHref ? normalizeTopicHref(rawHref) : "";
    if (title && href) {
      const author = extractAuthor(row.cells[1]);
      const replies = extractReplies(row.cells[2]);
      const activity = extractActivity(row.cells[3]);
      topics.push({
        ...(activity ? { activity } : {}),
        ...(author ? { author } : {}),
        href,
        ...(replies === undefined ? {} : { replies }),
        title,
      });
      if (topics.length === MAX_DISCUSSION_TOPICS) {
        break;
      }
    }
  }
  return topics;
};

const extractStartDiscussionHref = (container: Element): string => {
  const link = container.querySelector<HTMLAnchorElement>(
    ".hd-ops .comment_btn, .mod-hd .comment_btn"
  );
  const rawHref = link?.getAttribute("href")?.trim() ?? "";
  return rawHref ? normalizeDoubanHref(rawHref, START_DISCUSSION_PATH) : "";
};

const linkHref = (link: HTMLAnchorElement | null, path: RegExp): string => {
  const rawHref = link?.getAttribute("href")?.trim() ?? "";
  return rawHref ? normalizeDoubanHref(rawHref, path) : "";
};

const extractLinkTotal = (link: Element | null): number | undefined => {
  const totalMatch = /全部\s*(?<total>\d+|\d{1,3}(?:,\d{3})+)\s*条/u.exec(
    safeText(link)
  );
  const total = totalMatch?.groups?.total
    ? Number(totalMatch.groups.total.replaceAll(",", ""))
    : Number.NaN;
  return Number.isSafeInteger(total) ? total : undefined;
};

const extractAllDiscussions = (
  container: Element
): DiscussionCollectionLink | undefined => {
  /* Strategy 1: <p> link after the table (小组讨论 / 讨论区 Type 2) */
  const pLink = container.querySelector<HTMLAnchorElement>("p a");
  const pHref = linkHref(pLink, COLLECTION_PATH);
  if (pHref) {
    const total = extractLinkTotal(pLink);
    return total === undefined ? { href: pHref } : { href: pHref, total };
  }

  /* Strategy 2: "全部" link inside <h2> (讨论区 Type 1) */
  const h2Link = container.querySelector<HTMLAnchorElement>("h2 .pl a");
  const h2Href = linkHref(h2Link, DISCUSSION_COLLECTION_PATH);
  if (h2Href) {
    return { href: h2Href };
  }

  /* Strategy 3: link inside .mv-discussion-list (讨论区 Type 1 fallback with count) */
  const listLink = container.querySelector<HTMLAnchorElement>(
    ".mv-discussion-list a"
  );
  const listHref = linkHref(listLink, DISCUSSION_COLLECTION_PATH);
  if (listHref) {
    const total = extractLinkTotal(listLink);
    return total === undefined ? { href: listHref } : { href: listHref, total };
  }

  return undefined;
};

/* ── Container detection ─────────────────────────────── */

/**
 * Find a discussion mod container (讨论区 Type 1: <div class="mod">)
 * that contains a `.mv-discussion-list`.
 */
const findModDiscussion = (doc: Document): Element | null => {
  for (const mod of $$<Element>(".mod", doc)) {
    if (mod.querySelector(".mv-discussion-list")) {
      return mod;
    }
  }
  return null;
};

const extractFromContainer = (container: Element): DiscussionData => {
  const topics = extractTopics(container);
  const startDiscussionHref = extractStartDiscussionHref(container);
  const allDiscussions = extractAllDiscussions(container);
  return {
    ...(allDiscussions ? { allDiscussions } : {}),
    ...(startDiscussionHref ? { startDiscussionHref } : {}),
    topics,
  };
};

/* ── Public API ──────────────────────────────────────── */

const extractDiscussions = (doc: Document): DiscussionData => {
  /* Try primary container: .section-discussion (小组讨论 / 讨论区 Type 2) */
  const primary = doc.querySelector(".section-discussion");
  if (primary) {
    return extractFromContainer(primary);
  }

  /* Fallback: div.mod with .mv-discussion-list (讨论区 Type 1) */
  const mod = findModDiscussion(doc);
  if (mod) {
    return extractFromContainer(mod);
  }

  return { topics: [] };
};

export { extractDiscussions };
