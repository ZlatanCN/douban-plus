/* ── Series Extractor ──────────────────────────────────── */
/* "同系列作品" carousel from #series-items section.       */

import type { SeriesItem } from "../types";
import { $, $$, safeText } from "../utils/dom";

/* ── Chinese numeral helpers ──────────────────────────── */

const CN_DIGIT: Record<string, number> = {
  一: 1,
  七: 7,
  三: 3,
  九: 9,
  二: 2,
  五: 5,
  八: 8,
  六: 6,
  四: 4,
};

/** Parse a Chinese numeral (e.g. "七" → 7, "十二" → 12, "二十" → 20). */
const parseCnNum = (s: string): number => {
  /* Arabic digit in Chinese text — uncommon but handle it */
  const arabic = Math.trunc(Number(s));
  if (!Number.isNaN(arabic)) {
    return arabic;
  }

  const parts = s.split("十");
  if (parts.length === 2) {
    const tens = parts[0] ? (CN_DIGIT[parts[0]] ?? 1) : 1;
    const ones = parts[1] ? (CN_DIGIT[parts[1]] ?? 0) : 0;
    return tens * 10 + ones;
  }
  if (s === "十") {
    return 10;
  }
  return CN_DIGIT[s] ?? 0;
};

/** Extract season number from a title like "第一季" or "第1季". */
const seasonNum = (title: string): number => {
  const m = title.match(/第\s*(?<num>[\d一二三四五六七八九十百]+)\s*季/u);
  if (!m?.groups?.num) {
    return 0;
  }
  return parseCnNum(m.groups.num);
};

/* ── Extractor ────────────────────────────────────────── */

const extractSeries = (doc: Document): SeriesItem[] => {
  const container = $("#series-items .items-swiper", doc);
  if (!container) {
    return [];
  }

  const seen = new Set<string>();
  const items = $$<HTMLElement>(".items-swiper-item", container);
  const out: SeriesItem[] = [];

  for (const el of items) {
    const linkEl = $<HTMLAnchorElement>(".items-swiper-item-pic a", el);
    const imgEl = $<HTMLImageElement>(".items-swiper-item-pic a img", el);
    const titleEl = $<HTMLAnchorElement>(".items-swiper-item-title a", el);
    const ratingEl = $<HTMLElement>(".items-swiper-item-rating", el);
    const link = linkEl ? linkEl.href : "";
    if (!link || seen.has(link)) {
      continue;
    }
    seen.add(link);
    out.push({
      link,
      poster: imgEl ? imgEl.src || imgEl.dataset.src || "" : "",
      rating: safeText(ratingEl),
      title: safeText(titleEl),
    });
  }

  /* Sort chronologically by season number (S1 → S2 → … → S8) */
  return [...out].toSorted((a, b) => seasonNum(a.title) - seasonNum(b.title));
};

export { extractSeries };
