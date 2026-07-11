import type {
  DiscussionActivity,
  DiscussionAuthor,
  DiscussionCollectionLink,
  DiscussionData,
  DiscussionTopic,
} from "@/types";
import { $$, safeText } from "@/utils/dom";

const MAX_DISCUSSION_TOPICS = 10;
const DOUBAN_GROUP_ORIGIN = "https://www.douban.com/";
const GROUP_TOPIC_PATH = /^\/group\/topic\/\d+\/?$/u;
const GROUP_COLLECTION_PATH = /^\/group\/\d+\/?$/u;
const AUTHOR_PROFILE_PATH = /^\/people\/[^/]+\/?$/u;
const START_DISCUSSION_PATH = /^\/(?:group\/\d+\/?|register\/?)$/u;
const DISCUSSION_TIMESTAMP =
  /^(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2})(?::(?<seconds>\d{2}))?$/u;

const isTrackingParameter = (fragment: string): boolean => {
  const [rawKey] = fragment.split("=", 1);
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
    const url = new URL(rawHref, DOUBAN_GROUP_ORIGIN);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.hostname !== "www.douban.com" ||
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
  if (!url || !GROUP_TOPIC_PATH.test(url.pathname)) {
    return "";
  }
  const search = removeTrackingParameter(url.search);
  return `${url.origin}${url.pathname}${search}${url.hash}`;
};

const normalizeDoubanHref = (rawHref: string, path: RegExp): string => {
  const url = toSafeDoubanUrl(rawHref);
  return url && path.test(url.pathname) ? url.href : "";
};

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
  const match = /^(?<replies>\d+)\s*回应$/u.exec(text);
  const replies = match?.groups ? Number(match.groups.replies) : Number.NaN;
  return Number.isSafeInteger(replies) ? replies : undefined;
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
  const dateTime = `${date}T${time}${seconds ? `:${seconds}` : ""}`;
  return isValidDiscussionTimestamp(dateTime)
    ? { date, dateTime, raw, time }
    : { raw };
};

const extractStartDiscussionHref = (doc: Document): string => {
  const link = doc.querySelector<HTMLAnchorElement>(
    ".section-discussion .hd-ops .comment_btn"
  );
  const rawHref = link?.getAttribute("href")?.trim() ?? "";
  return rawHref ? normalizeDoubanHref(rawHref, START_DISCUSSION_PATH) : "";
};

const extractAllDiscussions = (
  doc: Document
): DiscussionCollectionLink | undefined => {
  const link = doc.querySelector<HTMLAnchorElement>(
    ".section-discussion table.olt ~ p a"
  );
  const rawHref = link?.getAttribute("href")?.trim() ?? "";
  const href = rawHref
    ? normalizeDoubanHref(rawHref, GROUP_COLLECTION_PATH)
    : "";
  if (!href) {
    return undefined;
  }
  const totalMatch = /全部\s*(?<total>\d+|\d{1,3}(?:,\d{3})+)\s*条/u.exec(
    safeText(link)
  );
  const total = totalMatch?.groups
    ? Number(totalMatch.groups.total.replaceAll(",", ""))
    : Number.NaN;
  return Number.isSafeInteger(total) ? { href, total } : { href };
};

const extractDiscussions = (doc: Document): DiscussionData => {
  const topics: DiscussionTopic[] = [];
  for (const row of $$<HTMLTableRowElement>(
    ".section-discussion table.olt tr",
    doc
  )) {
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
  const startDiscussionHref = extractStartDiscussionHref(doc);
  const allDiscussions = extractAllDiscussions(doc);
  return {
    ...(allDiscussions ? { allDiscussions } : {}),
    ...(startDiscussionHref ? { startDiscussionHref } : {}),
    topics,
  };
};

export { extractDiscussions };
