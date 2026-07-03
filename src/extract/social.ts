/* ── Social Extractors ─────────────────────────────────── */
/* User comments and related recommendations.              */

import { RE_ALLSTAR, RE_NON_DIGIT } from "../constants";
import type { Comment, Recommendation } from "../types";
import { $, $$, safeText } from "../utils/dom";
import { upgradePoster } from "../utils/upgrade";

/**
 * Extract related recommendations from `.recommendations-bd`.
 * Iterates `<dl>` items and pulls title, poster image, and link.
 *
 * @param doc - The parent document to query against.
 */
const extractRecommendations = (doc: Document): Recommendation[] =>
  $$<HTMLDListElement>(".recommendations-bd dl", doc)
    .map((dl) => {
      const linkEl = $<HTMLAnchorElement>("dt a", dl);
      const imgEl = $<HTMLImageElement>("dt a img", dl);
      const titleEl = $<HTMLAnchorElement>("dd a", dl);
      const rawPoster = imgEl
        ? (imgEl as HTMLImageElement).src || imgEl.dataset.src || ""
        : "";
      return {
        link: linkEl ? linkEl.href : "",
        poster: upgradePoster(rawPoster) || "",
        title: safeText(titleEl),
      };
    })
    .filter((r) => r.title);

/* ── Comment Field Extractors ──────────────────────────── */

const extractRating = (
  item: HTMLElement
): { stars: number; ratingWord: string } => {
  const ratingEl = $<HTMLElement>('[class*="allstar"]', item);
  if (!ratingEl) {
    return { ratingWord: "", stars: 0 };
  }

  const rm = (ratingEl.className || "").match(RE_ALLSTAR);
  return {
    ratingWord: ratingEl.getAttribute("title") || "",
    stars: rm ? Number.parseInt(rm[1], 10) / 10 : 0,
  };
};

const extractTime = (item: HTMLElement): string => {
  const timeEl = $<HTMLElement>(".comment-time", item);
  return timeEl ? timeEl.getAttribute("title") || safeText(timeEl) : "";
};

const extractVotes = (item: HTMLElement): number => {
  const votesEl =
    $<HTMLElement>(".vote-count", item) ?? $<HTMLElement>(".votes", item);
  return votesEl
    ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0
    : 0;
};

const extractAvatar = (item: HTMLElement): string => {
  const img = $<HTMLImageElement>(".avatar img", item);
  if (!img) {
    return "";
  }
  return encodeURI(img.src || img.dataset.original || img.dataset.src || "");
};

/**
 * Extract user comments from "#hot-comments" section.
 * Iterates `.comment-item` elements and pulls author, content,
 * star rating, time, votes, and avatar.
 *
 * @param doc - The parent document to query against.
 */
const extractComments = (doc: Document): Comment[] => {
  const items = $$<HTMLElement>("#hot-comments .comment-item", doc);
  const out: Comment[] = [];
  for (const item of items) {
    const authorEl = $<HTMLAnchorElement>(".comment-info a", item);
    const name = safeText(authorEl);
    if (!name) {
      continue;
    }

    const contentEl =
      $<HTMLElement>(".full", item) ??
      $<HTMLElement>(".short", item) ??
      $<HTMLElement>(".comment-content", item);
    const content = safeText(contentEl);
    if (!content) {
      continue;
    }

    const { stars, ratingWord } = extractRating(item);
    // After voting, Douban replaces a.j.vote-comment with a "已投票" span
    const voted = !item.querySelector(".j.vote-comment");

    out.push({
      avatar: extractAvatar(item),
      cid: item.dataset.cid ?? "",
      content,
      link: authorEl?.href ?? "",
      name,
      ratingWord,
      stars,
      time: extractTime(item),
      voted,
      votes: extractVotes(item),
    });
  }
  return out;
};

/* ── Exports ──────────────────────────────────────────── */

export { extractComments, extractRecommendations };
