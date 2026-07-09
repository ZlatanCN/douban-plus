/* ── Resolution Context Builder ───────────────────────────
 * Builds a ResolutionContext from already-extracted identifiers
 * plus the Douban document for H1-based title parsing. */

import {
  extractEnglishSeriesName,
  extractSeasonFromH1,
} from "@/extract/title-helpers";

import type { ResolutionContext } from "./types";

/** Build the resolution context from available identifiers and the DOM.
 *
 *  @param imdbId - IMDb ID from extractInfo(), null when absent
 *  @param isTV   - Whether the page is a TV series
 *  @param doc    - The Douban document for H1-based title/season/year extraction
 */
const buildContext = (
  imdbId: string | null,
  isTV: boolean,
  doc: Document
): ResolutionContext => {
  const doubanH1 = doc.querySelector("#content h1")?.textContent?.trim() || "";

  const englishTitle = doubanH1 ? extractEnglishSeriesName(doubanH1) : null;

  const season = doubanH1 ? extractSeasonFromH1(doubanH1) : undefined;

  // Extract year from trailing "(YYYY)" in Douban H1 for URL disambiguation
  const yearMatch = doubanH1.match(/\((?<year>\d{4})\)\s*$/u);
  const year = isTV ? undefined : (yearMatch?.groups?.year ?? undefined);

  return {
    englishTitle: englishTitle || null,
    imdbId,
    isTV,
    season,
    year,
  };
};

export { buildContext };
