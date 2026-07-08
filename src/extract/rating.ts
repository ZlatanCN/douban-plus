/* ── Rating / Summary Extractors ────────────────────────── */

import { RE_HSPACE, RE_NL_MULTI, RE_NON_DIGIT, RE_WS_NL } from "../constants";
import type { RatingInfo } from "../types";
import { $, safeText } from "../utils/dom";

/**
 * Extract rating score and vote count from the page.
 * Returns null when no valid score is found.
 */
const extractRating = (doc: Document): RatingInfo | null => {
  const scoreEl =
    $<HTMLElement>("strong.rating_num", doc) ||
    $<HTMLElement>('strong[property="v:average"]', doc);
  const raw = safeText(scoreEl);
  const score = raw ? Number(raw) : Number.NaN;
  if (!score || Number.isNaN(score) || score <= 0) {
    return null;
  }

  const votesEl =
    $<HTMLElement>('span[property="v:votes"]', doc) ||
    $<HTMLElement>(".rating_people span", doc);
  const count = votesEl
    ? Math.trunc(Number(safeText(votesEl).replace(RE_NON_DIGIT, ""))) || 0
    : 0;

  return { count, score };
};

/**
 * Extract the movie summary / description text.
 * Returns null if no summary element exists.
 */
const extractSummary = (doc: Document): string | null => {
  const summary = $<HTMLElement>('span[property="v:summary"]', doc);
  if (!summary) {
    return null;
  }

  let txt = (summary.textContent || "").trim();
  txt = txt
    .replace(RE_WS_NL, "\n")
    .replace(RE_HSPACE, " ")
    .replace(RE_NL_MULTI, "\n\n")
    .trim();
  return txt || null;
};

/* ── Exports ──────────────────────────────────────────── */

export { extractRating, extractSummary };
