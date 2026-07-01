import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Scenario } from "./types";

const DOUBAN_NOISE_REGEX =
  /verify_users|rexxar|ERR_NAME_NOT_RESOLVED|status of 418|React error|reactjs\.org|ERR_FAILED|Access to XMLHttpRequest|net::ERR/u;
const ATV_NOISE_REGEX = /ATV-Douban|atv-douban-root|atv-/u;
const ATV_STACK_REGEX = /ATV-Douban|atv-/u;

const TIMEOUT_PAGE_LOAD = 60_000;
const TIMEOUT_CONTENT_READY = 30_000;

const COLOR_BLACK_RGB = "rgb(0, 0, 0)";
const COLOR_GOLD_RGB = "rgb(255, 184, 0)";
const SCROLL_TEST_POSITION = 700;
const STICKY_NAV_MIN_OPACITY = 0.8;
const EXTERNAL_URL_REGEX = /^https:\/\//u;
const TV_EPISODE_REGEX = /(?:[集季](?:数)?\s*[：:]?\s*\d+|\d+\s*[集季])/u;
const PERSONAGE_LINK_REGEX = /personage/u;
const SUBJECT_LINK_REGEX = /subject\/\d+/u;
const IMDB_LINK_REGEX = /imdb\.com\/title\/tt/u;
const STICKY_NAV_HIDDEN_REGEX = /rgba\(\d+,\s*\d+,\s*\d+,\s*0\)/u;

const __dirname = import.meta.dirname;
const ROOT = path.dirname(path.dirname(__dirname));
const USERSCRIPT_PATH = path.join(ROOT, "dist/douban-plus.user.js");
const SCREENSHOT_DIR = path.join(path.dirname(__dirname), "screenshots");

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const userscriptRaw = readFileSync(USERSCRIPT_PATH, "utf-8");

const gmShim = `
window.GM_addStyle = function(css) {
  const s = document.createElement('style');
  s.textContent = css;
  s.setAttribute('data-atv-shim', '1');
  (document.head || document.documentElement).appendChild(s);
  return s;
};
window.GM_xmlhttpRequest = function(details) {
  console.log('[gmShim] GM_xmlhttpRequest ' + (details.method || 'GET') + ' ' + (details.url || ''));
  if (typeof details.onload === 'function') {
    details.onload({ responseText: '{}', status: 200 });
  }
};
`;

const injectAfterLoad = userscriptRaw.replace(
  /^\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\n?/mu,
  ""
);

const SCENARIOS: Scenario[] = [
  /* ── Existing (keep for regression) ── */
  {
    kind: "movie",
    name: "movie-shawshank",
    url: "https://movie.douban.com/subject/1292052/",
  },
  {
    kind: "movie",
    name: "movie-nezha",
    url: "https://movie.douban.com/subject/26794435/",
  },
  {
    kind: "movie",
    name: "movie-wandering-earth-2",
    url: "https://movie.douban.com/subject/35267208/",
  },
  {
    kind: "tv",
    name: "tv-got-s1",
    url: "https://movie.douban.com/subject/3016187/",
  },
  /* ── Boundary: Chinese TV drama ── */
  {
    kind: "tv",
    name: "tv-blossoms-shanghai",
    url: "https://movie.douban.com/subject/34874646/",
  },
  /* ── Boundary: Japanese anime film ── */
  {
    kind: "movie",
    name: "movie-spirited-away",
    url: "https://movie.douban.com/subject/1291561/",
  },
  /* ── Boundary: Old movie (1950, pre-streaming era) ── */
  {
    kind: "movie",
    name: "movie-rashomon",
    url: "https://movie.douban.com/subject/1291879/",
  },
  /* ── Boundary: Niche indie film ── */
  {
    kind: "movie",
    name: "movie-all-about-ing",
    url: "https://movie.douban.com/subject/26752564/",
  },
  /* ── Boundary: Modern blockbuster ── */
  {
    kind: "movie",
    name: "movie-oppenheimer",
    url: "https://movie.douban.com/subject/35593344/",
  },
  /* ── Trailer-specific: movie with multiple trailers ── */
  {
    kind: "movie",
    name: "movie-wandering-earth",
    url: "https://movie.douban.com/subject/26266893/",
  },
];

const MAX_RETRIES = 2;
const SCENARIO_DEADLINE_MS = 90_000;

const C = {
  bgGreen: "\u001B[42m",
  bgRed: "\u001B[41m",
  bold: "\u001B[1m",
  cyan: "\u001B[36m",
  dim: "\u001B[2m",
  green: "\u001B[32m",
  red: "\u001B[31m",
  reset: "\u001B[0m",
  white: "\u001B[37m",
  yellow: "\u001B[33m",
};

export {
  ATV_NOISE_REGEX,
  ATV_STACK_REGEX,
  COLOR_BLACK_RGB,
  COLOR_GOLD_RGB,
  C,
  DOUBAN_NOISE_REGEX,
  EXTERNAL_URL_REGEX,
  gmShim,
  IMDB_LINK_REGEX,
  injectAfterLoad,
  MAX_RETRIES,
  PERSONAGE_LINK_REGEX,
  SCENARIOS,
  SCENARIO_DEADLINE_MS,
  SCROLL_TEST_POSITION,
  SCREENSHOT_DIR,
  STICKY_NAV_HIDDEN_REGEX,
  STICKY_NAV_MIN_OPACITY,
  SUBJECT_LINK_REGEX,
  TIMEOUT_CONTENT_READY,
  TIMEOUT_PAGE_LOAD,
  TV_EPISODE_REGEX,
};
