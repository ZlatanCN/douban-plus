/* ── Resolution Context Builder ───────────────────────────
 * Builds a ResolutionContext from already-extracted identifiers
 * plus the Douban H1 title string. Pure: performs no DOM access,
 * so the resolve/ layer stays DOM-free per CONTEXT.md. */

import {
  extractEnglishSeriesName,
  extractSeasonFromH1,
  extractYearFromH1,
} from "@/modules/subject/extract/title-helpers";

import type { ResolutionContext } from "./types";

/** Build the resolution context from available identifiers and the H1 title.
 *
 *  @param imdbId - IMDb ID from extractInfo(), null when absent
 *  @param isTV   - Whether the page is a TV series
 *  @param h1     - The Douban H1 title string (read via extractH1 from the DOM)
 */
const buildContext = (
  imdbId: string | null,
  isTV: boolean,
  h1: string
): ResolutionContext => {
  const englishTitle = h1 ? extractEnglishSeriesName(h1) || null : null;

  const season = h1 ? extractSeasonFromH1(h1) : undefined;

  // Trailing "(YYYY)" in the H1 disambiguates slugs for both movies and TV.
  // TV shows with the same name (e.g. UK vs US "House of Cards") need the
  // year to avoid matching the wrong entry on Metacritic / RT.
  const year = extractYearFromH1(h1);

  return {
    englishTitle,
    imdbId,
    isTV,
    ...(season === undefined ? {} : { season }),
    ...(year === undefined ? {} : { year }),
  };
};

export { buildContext };
