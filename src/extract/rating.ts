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

const expandNativeSummary = (
  doc: Document = document
): Promise<string | null> => {
  const before = extractSummary(doc);
  const trigger = doc.querySelector<HTMLAnchorElement>("a.a_show_full");
  if (!trigger) {
    return Promise.resolve(before);
  }

  trigger.click();
  const after = extractSummary(doc);
  if (after && after !== before) {
    return Promise.resolve(after);
  }

  // eslint-disable-next-line promise/avoid-new -- MutationObserver resolves only after Douban replaces the host summary node.
  return new Promise((resolve) => {
    const summary = doc.querySelector('span[property="v:summary"]');
    if (!summary) {
      resolve(after);
      return;
    }
    const observer = new MutationObserver(() => {
      const expanded = extractSummary(doc);
      if (expanded && expanded !== before) {
        observer.disconnect();
        resolve(expanded);
      }
    });
    observer.observe(summary.parentElement ?? summary, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    window.setTimeout(() => {
      observer.disconnect();
      resolve(extractSummary(doc));
    }, 1500);
  });
};

/* ── Exports ──────────────────────────────────────────── */

export { expandNativeSummary, extractRating, extractSummary };
