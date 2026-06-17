/* ── Social Extractors ─────────────────────────────────── */
/* User comments and related recommendations.              */

import { RE_ALLSTAR, RE_NON_DIGIT } from "../constants";
import type { Comment, Recommendation } from "../types";
import { $, $$, safeText } from "../utils/dom";

/**
 * Extract related recommendations from `.recommendations-bd`.
 * Iterates `<dl>` items and pulls title, poster image, and link.
 */
const extractRecommendations = (): Recommendation[] =>
  $$<HTMLDListElement>(".recommendations-bd dl")
    .map((dl) => {
      const linkEl = $<HTMLAnchorElement>("dt a", dl);
      const imgEl = $<HTMLImageElement>("dt a img", dl);
      const titleEl = $<HTMLAnchorElement>("dd a", dl);
      return {
        link: linkEl ? linkEl.href : "",
        poster: imgEl
          ? (imgEl as HTMLImageElement).src || imgEl.dataset.src || ""
          : "",
        title: safeText(titleEl),
      };
    })
    .filter((r) => r.title);

/**
 * Extract user comments from "#hot-comments" section.
 * Iterates `.comment-item` elements and pulls author, content,
 * star rating, time, votes, and avatar.
 */
const extractComments = (): Comment[] => {
  const items = $$<HTMLElement>("#hot-comments .comment-item");
  const out: Comment[] = [];
  for (const item of items) {
    const authorEl = $<HTMLAnchorElement>(".comment-info a", item);
    const name = safeText(authorEl);
    if (!name) {
      continue;
    }
    const shortEl =
      $<HTMLElement>(".short", item) ??
      $<HTMLElement>(".comment-content", item);
    const content = safeText(shortEl);
    if (!content) {
      continue;
    }
    const ratingEl = $<HTMLElement>('[class*="allstar"]', item);
    let stars = 0;
    let ratingWord = "";
    if (ratingEl) {
      const rm = (ratingEl.className || "").match(RE_ALLSTAR);
      if (rm) {
        stars = Number.parseInt(rm[1], 10) / 10;
      }
      ratingWord = ratingEl.getAttribute("title") || "";
    }
    const timeEl = $<HTMLElement>(".comment-time", item);
    const time = timeEl ? timeEl.getAttribute("title") || safeText(timeEl) : "";
    const votesEl =
      $<HTMLElement>(".vote-count", item) ?? $<HTMLElement>(".votes", item);
    const votes = votesEl
      ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0
      : 0;
    const avatarImg = $<HTMLImageElement>(".avatar img", item);
    let avatar = "";
    if (avatarImg) {
      avatar =
        (avatarImg as HTMLImageElement).src ||
        avatarImg.dataset.original ||
        avatarImg.dataset.src ||
        "";
    }
    out.push({
      avatar,
      content,
      link: authorEl && authorEl.tagName === "A" ? authorEl.href : "",
      name,
      ratingWord,
      stars,
      time,
      votes,
    });
  }
  return out;
};

/* ── Exports ──────────────────────────────────────────── */

export { extractComments, extractRecommendations };
