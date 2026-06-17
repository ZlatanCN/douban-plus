/* ── Basic Extractors ─────────────────────────────────── */
/* Title, year, poster, subject ID.                        */

import { RE_SUBJECT_ID, RE_WS, RE_YEAR, RE_YEAR_TRAIL } from "../constants";
import type { TitleInfo } from "../types";
import { $, safeText } from "../utils/dom";
import { upgradePoster } from "../utils/upgrade";

/**
 * Extract full / primary / original title from the page heading.
 */
const extractTitle = (): TitleInfo => {
  const h1 = $("#content h1");
  const reviewed = $<HTMLSpanElement>(
    'span[property="v:itemreviewed"]',
    h1 ?? undefined
  );
  const full =
    safeText(reviewed) || safeText(h1).replace(RE_YEAR_TRAIL, "").trim();
  let primary = full;
  let original = "";
  const idx = full.search(RE_WS);
  if (idx > 0) {
    primary = full.slice(0, idx).trim();
    original = full.slice(idx).trim();
  }
  return { full, original, primary };
};

/**
 * Extract year string (e.g. "1994") from the .year element.
 */
const extractYear = (): string => {
  const yEl = $("#content h1 .year");
  const raw = safeText(yEl);
  const m = raw.match(RE_YEAR);
  return m ? m[1] : "";
};

/**
 * Extract poster image URL and upgrade to HD.
 */
const extractPoster = (): string | null => {
  const img =
    $<HTMLImageElement>("#mainpic img") || $<HTMLImageElement>("a.nbgnbg img");
  if (!img) {
    return null;
  }
  const src = img.src || img.dataset.src || "";
  return upgradePoster(src);
};

/**
 * Extract subject ID from the current URL path.
 */
const extractSubjectId = (): string => {
  const m = location.pathname.match(RE_SUBJECT_ID);
  return m ? m[1] : "";
};

/* ── Exports ──────────────────────────────────────────── */

export { extractPoster, extractSubjectId, extractTitle, extractYear };
