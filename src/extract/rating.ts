/* ── Rating / Summary Extractors ────────────────────────── */

import { RE_HSPACE, RE_NL_MULTI, RE_NON_DIGIT } from "@/constants";
import type { RatingInfo } from "@/types";
import { $, safeText } from "@/utils/dom";

const RE_CRLF = /\r\n?/gu;
const RE_LINE_EDGE_HSPACE = /^[ \t\u00A0\u3000]+|[ \t\u00A0\u3000]+$/gu;

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

const normalizeSummaryText = (text: string): string =>
  text
    .replace(RE_CRLF, "\n")
    .split("\n")
    .map((line) =>
      line.replace(RE_LINE_EDGE_HSPACE, "").replace(RE_HSPACE, " ")
    )
    .join("\n")
    .replace(RE_NL_MULTI, "\n")
    .trim();

/**
 * Extract the movie summary / description text.
 * Returns null if no summary element exists.
 */
const extractSummary = (doc: Document): string | null => {
  const summary = $<HTMLElement>('span[property="v:summary"]', doc);
  if (!summary) {
    return null;
  }

  const txt = normalizeSummaryText(summary.textContent || "");
  return txt || null;
};

const extractVisibleSummary = (doc: Document): string | null => {
  const container = doc.querySelector("#link-report-intra");
  if (!container) {
    return extractSummary(doc);
  }
  const visible = [...container.children].find(
    (child) =>
      child instanceof HTMLElement &&
      !child.classList.contains("pl") &&
      child.style.display !== "none"
  );
  const text = normalizeSummaryText(visible?.textContent || "").replace(
    /\s*\(展开全部\)\s*$/u,
    ""
  );
  return text || extractSummary(doc);
};

const expandNativeSummary = (
  doc: Document = document
): Promise<string | null> => {
  const before = extractVisibleSummary(doc);
  const trigger = doc.querySelector<HTMLAnchorElement>("a.a_show_full");
  if (!trigger) {
    return Promise.resolve(before);
  }

  trigger.click();
  const after = extractVisibleSummary(doc);
  return Promise.resolve(after || before);
};

/* ── Exports ──────────────────────────────────────────── */

export {
  expandNativeSummary,
  extractRating,
  extractSummary,
  extractVisibleSummary,
};
