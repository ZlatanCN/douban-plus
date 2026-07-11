import type { DiscussionData, DiscussionTopic } from "@/types";
import { $$, safeText } from "@/utils/dom";

const MAX_DISCUSSION_TOPICS = 10;
const DOUBAN_GROUP_ORIGIN = "https://www.douban.com/";
const GROUP_TOPIC_PATH = /^\/group\/topic\/\d+\/?$/u;

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

const normalizeTopicHref = (rawHref: string): string => {
  try {
    const url = new URL(rawHref, DOUBAN_GROUP_ORIGIN);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    if (
      url.hostname !== "www.douban.com" ||
      url.port ||
      url.username ||
      url.password ||
      !GROUP_TOPIC_PATH.test(url.pathname)
    ) {
      return "";
    }
    const search = removeTrackingParameter(url.search);
    return `${url.origin}${url.pathname}${search}${url.hash}`;
  } catch {
    return "";
  }
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
      topics.push({ href, title });
      if (topics.length === MAX_DISCUSSION_TOPICS) {
        break;
      }
    }
  }
  return { topics };
};

export { extractDiscussions };
