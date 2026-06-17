/* ── Awards Extractor ──────────────────────────────────── */

import type { Award } from "../types";
import { $, $$, safeText } from "../utils/dom";

/**
 * Extract awards from `ul.award` elements in the info section.
 *
 * Each award is a `ul.award` with 3 `li` children:
 *   0: organization name (may contain `<a>`)
 *   1: award name (plain text)
 *   2: person name (may contain `<a>`)
 */
function extractAwards(): Award[] {
  return $$("ul.award")
    .map((ul) => {
      const lis = $$("li", ul);
      const orgEl = lis[0] ? $<HTMLAnchorElement>("a", lis[0]) : null;
      const org = lis[0] ? safeText(lis[0]) : "";
      const name = lis[1] ? safeText(lis[1]) : "";
      const personEl = lis[2] ? $<HTMLAnchorElement>("a", lis[2]) : null;
      const person = lis[2] ? safeText(lis[2]) : "";
      return {
        org,
        orgLink: orgEl ? orgEl.href : "",
        name,
        person,
        personLink: personEl ? personEl.href : "",
      };
    })
    .filter((a) => a.org);
}

/* ── Exports ──────────────────────────────────────────── */

export { extractAwards };
