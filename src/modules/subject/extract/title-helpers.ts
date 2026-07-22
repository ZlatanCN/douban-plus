/* ── Douban H1 Parsing Helpers ──────────────────────────── */

import { RE_H1_YEAR } from "@/modules/subject/constants";

/** Strip season/variant info from a Douban h1 like
 *  "权力的游戏 第五季 Game of Thrones Season 5 (2015)"
 *  to extract just the English series name ("Game of Thrones"). */
const extractEnglishSeriesName = (h1: string): string => {
  const cleaned = h1.replace(/\s*\(\d{4}\)\s*$/u, "").trim();
  const m = cleaned.match(/[A-Za-z][\w\s'\-!&.,]*/u);
  if (!m) {
    return "";
  }
  return m[0].replace(/\s*(?<seasonLabel>Season|S|Vol)\s*\d+/iu, "").trim();
};

const extractSeasonFromH1 = (h1: string): number | undefined => {
  const cn = "一二三四五六七八九十";
  const m = h1.match(/(?:Season|第)\s*(?<digit>\d+|[一二三四五六七八九十])/iu);
  if (!m?.groups?.digit) {
    return undefined;
  }
  const d = m.groups.digit;

  return /^\d+$/u.test(d) ? Math.trunc(Number(d)) : cn.indexOf(d) + 1;
};

/** Read the Douban page H1 text from the document.
 *  This is the single DOM access point for H1 data; the string
 *  transforms below stay DOM-free. Returns "" when no H1 is present. */
const extractH1 = (doc: Document): string =>
  doc.querySelector("#content h1")?.textContent?.trim() || "";

/** Extract the trailing release year from an H1 string, e.g. "1994"
 *  from "... (1994)". Used only for movie URL disambiguation; TV pages
 *  never carry a year here (callers omit it). Undefined when absent.
 *  Anchored to the trailing "(YYYY)" so a 4-digit run elsewhere in the
 *  title (e.g. "Blade Runner 2049 (2017)") is never mistaken for the year. */
const extractYearFromH1 = (h1: string): string | undefined =>
  h1.match(RE_H1_YEAR)?.groups?.year;

export {
  extractEnglishSeriesName,
  extractH1,
  extractSeasonFromH1,
  extractYearFromH1,
};
