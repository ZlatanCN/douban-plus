const RE_SLASH_SEP = /\s*\/\s*/gu;
const RE_WS_GLOBAL = /\s+/gu;
const RE_COLON_WS = /[:：\s]/gu;
const RE_YEAR_TRAIL = /\(\d{4}\)\s*$/u;
const RE_WS = /\s+/u;
const RE_YEAR = /(?<year>\d{4})/u;
const RE_NON_DIGIT = /\D/gu;
const RE_WS_NL = /\s+\n/gu;
const RE_HSPACE = /[ \t]+/gu;
const RE_NL_MULTI = /\n{3,}/gu;
const RE_IMDB_ID = /(?<id>tt\d+)/u;
const RE_BG_URL = /url\(["']?(?<url>[^"')]+)["']?\)/u;
const RE_SUBJECT_ID = /subject\/(?<id>\d+)/u;
const RE_ALLSTAR = /allstar(?<rating>\d{2})/u;
const RE_HTTP = /^https?:\/\//u;
const RE_ONLINE_VIDEO = /online-video/u;
const RE_WISH = /想看/u;
const RE_COLLECT = /看过/u;
const RE_WISH_EXACT = /^想看$/u;
const RE_COLLECT_EXACT = /^看过$/u;
const RE_INTEREST_ACTIVE = /done|active|on\b|j_a\b/u;
const RE_IMDB_LINK = /^tt\d+$/u;
const RE_SEASON_SUFFIX = /\d$/u;
const RE_PLAY_SOURCES =
  /sources\[(?<sourceId>\d+)\]\s*=\s*\[\s*\{play_link:\s*"(?<playLink>[^"]+)"/gu;
const RE_SOURCES_SCRIPT = /\bsources\s*\[/u;

const ICON_STAR_FULL =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
  '<path fill="currentColor" d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"/>' +
  "</svg>";
const ICON_STAR_HALF =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
  '<defs><linearGradient id="atvHalfStar"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="currentColor" stop-opacity="0.22"/></linearGradient></defs>' +
  '<path fill="url(#atvHalfStar)" d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"/>' +
  "</svg>";
const ICON_STAR_EMPTY =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
  '<path fill="currentColor" fill-opacity="0.22" d="M8 1.2l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.74l-4.12 2.16.79-4.6L1.33 6.05l4.61-.67L8 1.2z"/>' +
  "</svg>";
const ICON_PLAY =
  '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">' +
  '<path fill="currentColor" d="M3 1.6v10.8c0 .8.86 1.27 1.5.83l8.1-5.4a1 1 0 0 0 0-1.66L4.5.77C3.86.33 3 .8 3 1.6z"/>' +
  "</svg>";
const ICON_CHECK =
  '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">' +
  '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2.5 7.5l3 3 6-7"/>' +
  "</svg>";
const ICON_CHEVRON =
  '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">' +
  '<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M2.5 4l3.5 4 3.5-4"/>' +
  "</svg>";
const ICON_ARROW =
  '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">' +
  '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5"/>' +
  "</svg>";
const ICON_THUMB =
  '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">' +
  '<path fill="currentColor" d="M6.3 6.6L9 1.3c.7-.1 1.4.5 1.4 1.3v2.6h3c.9 0 1.5.8 1.3 1.6l-1.2 5.1c-.1.6-.7 1-1.3 1H6.3V6.6zM4.7 6.7v7H2.5c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1h2.2z"/>' +
  "</svg>";
const ICON_FILM_PLACEHOLDER =
  '<svg viewBox="0 0 64 96" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
  '<defs><linearGradient id="atvFilmGrad" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0%" stop-color="#2c2c2e"/><stop offset="100%" stop-color="#1c1c1e"/>' +
  "</linearGradient></defs>" +
  '<rect width="64" height="96" fill="url(#atvFilmGrad)"/>' +
  '<g fill="rgba(255,255,255,0.12)">' +
  '<rect x="4" y="6" width="6" height="6" rx="1"/><rect x="4" y="18" width="6" height="6" rx="1"/>' +
  '<rect x="4" y="30" width="6" height="6" rx="1"/><rect x="4" y="42" width="6" height="6" rx="1"/>' +
  '<rect x="4" y="54" width="6" height="6" rx="1"/><rect x="4" y="66" width="6" height="6" rx="1"/>' +
  '<rect x="4" y="78" width="6" height="6" rx="1"/>' +
  '<rect x="54" y="6" width="6" height="6" rx="1"/><rect x="54" y="18" width="6" height="6" rx="1"/>' +
  '<rect x="54" y="30" width="6" height="6" rx="1"/><rect x="54" y="42" width="6" height="6" rx="1"/>' +
  '<rect x="54" y="54" width="6" height="6" rx="1"/><rect x="54" y="66" width="6" height="6" rx="1"/>' +
  '<rect x="54" y="78" width="6" height="6" rx="1"/>' +
  "</g>" +
  '<path d="M26 38l14 10-14 10z" fill="rgba(255,255,255,0.28)"/>' +
  "</svg>";

export {
  ICON_ARROW,
  ICON_CHECK,
  ICON_CHEVRON,
  ICON_FILM_PLACEHOLDER,
  ICON_PLAY,
  ICON_STAR_EMPTY,
  ICON_STAR_FULL,
  ICON_STAR_HALF,
  ICON_THUMB,
  RE_ALLSTAR,
  RE_BG_URL,
  RE_COLLECT,
  RE_COLLECT_EXACT,
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
  RE_SEASON_SUFFIX,
  RE_SLASH_SEP,
  RE_SOURCES_SCRIPT,
  RE_SUBJECT_ID,
  RE_WISH,
  RE_WISH_EXACT,
  RE_WS,
  RE_WS_GLOBAL,
  RE_WS_NL,
  RE_YEAR,
  RE_YEAR_TRAIL,
};
