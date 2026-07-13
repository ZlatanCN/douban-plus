const RE_SLASH_SEP = /\s*\/\s*/gu;
const RE_WS_GLOBAL = /\s+/gu;
const RE_COLON_WS = /[:：\s]/gu;
const RE_YEAR_TRAIL = /\(\d{4}\)\s*$/u;
const RE_WS = /\s+/u;
const RE_YEAR = /(?<year>\d{4})/u;
const RE_NON_DIGIT = /\D/gu;
const RE_HSPACE = /[ \t]+/gu;
const RE_NL_MULTI = /\n{3,}/gu;
const RE_IMDB_ID = /(?<id>tt\d+)/u;
const RE_BG_URL = /url\(["']?(?<url>[^"')]+)["']?\)/u;
const RE_SUBJECT_ID = /subject\/(?<id>\d+)/u;
const RE_ALLSTAR = /allstar(?<rating>\d{2})/u;
const RE_HTTP = /^https?:\/\//u;
const RE_ONLINE_VIDEO = /online-video/u;
const RE_INTEREST_ACTIVE = /done|active|on\b|j_a\b/u;
const RE_IMDB_LINK = /^tt\d+$/u;
const RE_SEASON_SUFFIX = /\d$/u;
const RE_SEASON_EP = /^第[一二三四五六七八九十百\d]+[季集]\s*/u;
const RE_PLAY_SOURCES =
  /sources\[(?<sourceId>\d+)\]\s*=\s*\[\s*\{play_link:\s*"(?<playLink>[^"]+)"/gu;
const RE_SOURCES_SCRIPT = /\bsources\s*\[/u;

export {
  RE_ALLSTAR,
  RE_BG_URL,
  RE_COLON_WS,
  RE_HSPACE,
  RE_HTTP,
  RE_IMDB_ID,
  RE_IMDB_LINK,
  RE_INTEREST_ACTIVE,
  RE_NL_MULTI,
  RE_NON_DIGIT,
  RE_ONLINE_VIDEO,
  RE_PLAY_SOURCES,
  RE_SEASON_EP,
  RE_SEASON_SUFFIX,
  RE_SLASH_SEP,
  RE_SOURCES_SCRIPT,
  RE_SUBJECT_ID,
  RE_WS,
  RE_WS_GLOBAL,
  RE_YEAR,
  RE_YEAR_TRAIL,
};
