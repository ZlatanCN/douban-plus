/* ── Douban H1 Parsing Helpers ──────────────────────────── */

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

export { extractEnglishSeriesName, extractSeasonFromH1 };
