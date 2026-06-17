/* ── Rating / Summary Extractors ────────────────────────── */

import { RE_HSPACE, RE_NL_MULTI, RE_NON_DIGIT, RE_WS_NL } from "../constants";
import type { RatingInfo } from "../types";
import { $, safeText } from "../utils/dom";

/**
 * Extract rating score and vote count from the page.
 * Returns null when no valid score is found.
 */
function extractRating(): RatingInfo | null {
  const scoreEl =
    $<HTMLElement>("strong.rating_num") ||
    $<HTMLElement>('strong[property="v:average"]');
  const raw = safeText(scoreEl);
  const score = raw ? Number.parseFloat(raw) : Number.NaN;
  if (!score || Number.isNaN(score) || score <= 0) {
    return null;
  }

  const votesEl =
    $<HTMLElement>('span[property="v:votes"]') ||
    $<HTMLElement>(".rating_people span");
  const count = votesEl
    ? Number.parseInt(safeText(votesEl).replace(RE_NON_DIGIT, ""), 10) || 0
    : 0;

  return { score, count };
}

/**
 * Extract the movie summary / description text.
 * Returns null if no summary element exists.
 */
function extractSummary(): string | null {
  const summary = $<HTMLElement>('span[property="v:summary"]');
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
}

/* ── Exports ──────────────────────────────────────────── */

export { extractRating, extractSummary };
