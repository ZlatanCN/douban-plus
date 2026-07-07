/* ── Reviews (剧评) Extractors ─────────────────────────── */
/* Long-form review extraction from Douban subject pages.    */

import { RE_ALLSTAR } from "../constants";
import type { Review } from "../types";
import { $, $$, safeText } from "../utils/dom";

/**
 * Extract long-form reviews from #reviews-wrapper section.
 * Iterates .review-item elements and pulls author, rating, title,
 * content, time, useful count, and spoiler status.
 *
 * @param doc - The parent document to query against.
 */
const extractReviewRating = (
  item: HTMLElement
): { stars: number; ratingWord: string } => {
  let stars = 0;
  let ratingWord = "";
  const ratingEl = $<HTMLElement>('[class*="allstar"]', item);
  if (ratingEl) {
    const rm = (ratingEl.className || "").match(RE_ALLSTAR);
    if (rm) {
      stars = Number.parseInt(rm[1], 10) / 10;
    }
    ratingWord = ratingEl.getAttribute("title") || "";
  }
  if (stars === 0) {
    const titleRating = $<HTMLElement>(".main-title-rating", item);
    if (titleRating) {
      ratingWord = titleRating.getAttribute("title") || "";
    }
  }
  return { ratingWord, stars };
};

const extractReviewContent = (item: HTMLElement): string => {
  const shortContent = $<HTMLElement>(".review-short .short-content", item);
  if (shortContent) {
    shortContent.querySelector("a.unfold")?.remove();
    return safeText(shortContent)
      .replace(/[\s\u00A0]*\(\)[\s\u00A0]*$/u, "")
      .trim();
  }
  const mainBd = $(".main-bd", item);
  return mainBd ? safeText(mainBd) : "";
};

const extractReviewVotes = (
  item: HTMLElement
): { usefulCount: number; uselessCount: number } => {
  const action = $<HTMLElement>(".action", item);
  if (!action) {
    return { usefulCount: 0, uselessCount: 0 };
  }
  const upEl = $<HTMLElement>(".action-btn.up", action);
  const downEl = $<HTMLElement>(".action-btn.down", action);
  return {
    usefulCount: Number.parseInt((upEl?.textContent ?? "").trim(), 10) || 0,
    uselessCount: Number.parseInt((downEl?.textContent ?? "").trim(), 10) || 0,
  };
};

const extractReviewItem = (item: HTMLElement): Review | null => {
  const titleLink = $<HTMLAnchorElement>(".main-bd h2 a", item);
  const title = safeText(titleLink);
  if (!title) {
    return null;
  }

  const nameLink = $<HTMLAnchorElement>(".main-hd a.name", item);
  const name = safeText(nameLink);
  if (!name) {
    return null;
  }

  const avatarImg = $<HTMLImageElement>(".main-hd .avator img", item);
  const avatar = avatarImg
    ? encodeURI(
        avatarImg.src ||
          avatarImg.dataset.original ||
          avatarImg.dataset.src ||
          ""
      )
    : "";

  const { stars, ratingWord } = extractReviewRating(item);
  const time = safeText($(".main-hd .main-meta", item));
  const content = extractReviewContent(item);
  const { usefulCount, uselessCount } = extractReviewVotes(item);
  const spoiler = !!$(".spoiler-tip", item);

  return {
    avatar,
    content,
    id: item.id || "",
    link: nameLink?.href ?? "",
    name,
    ratingWord,
    spoiler,
    stars,
    time,
    title,
    usefulCount,
    uselessCount,
  };
};

const extractReviews = (doc: Document): Review[] => {
  const items = $$<HTMLElement>("#reviews-wrapper .review-item", doc);
  const out: Review[] = [];
  for (const item of items) {
    const review = extractReviewItem(item);
    if (review) {
      out.push(review);
    }
  }
  return out;
};

export { extractReviews };
