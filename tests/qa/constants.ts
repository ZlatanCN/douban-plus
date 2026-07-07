import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

import type { Scenario } from "./types";

const DOUBAN_NOISE_REGEX =
  /verify_users|rexxar|ERR_NAME_NOT_RESOLVED|status of 418|React error|reactjs\.org|ERR_FAILED|Access to XMLHttpRequest|net::ERR/u;
const ATV_NOISE_REGEX = /ATV-Douban|atv-douban-root|atv-/u;
const ATV_STACK_REGEX = /ATV-Douban|atv-/u;

const TIMEOUT_PAGE_LOAD = 60_000;
const TIMEOUT_CONTENT_READY = 30_000;

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
const DIST_FRESHNESS_ROOTS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "vite.config.ts"),
];

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const newestMtime = (entryPath: string): number => {
  if (!existsSync(entryPath)) {
    return 0;
  }

  const stat = statSync(entryPath);
  if (!stat.isDirectory()) {
    return stat.mtimeMs;
  }

  let latest = stat.mtimeMs;
  for (const child of readdirSync(entryPath)) {
    const childPath = path.join(entryPath, child);
    latest = Math.max(latest, newestMtime(childPath));
  }
  return latest;
};

const assertUserscriptFresh = (): void => {
  if (!existsSync(USERSCRIPT_PATH)) {
    throw new Error(
      `Missing ${path.relative(ROOT, USERSCRIPT_PATH)}. Run pnpm run build before pnpm run test:e2e.`
    );
  }

  const distMtime = statSync(USERSCRIPT_PATH).mtimeMs;
  const sourceMtime = Math.max(...DIST_FRESHNESS_ROOTS.map(newestMtime));
  if (sourceMtime > distMtime) {
    throw new Error(
      `${path.relative(ROOT, USERSCRIPT_PATH)} is older than source files. Run pnpm run build before pnpm run test:e2e.`
    );
  }
};

assertUserscriptFresh();

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
  /* ── Core regression ── */
  {
    kind: "movie",
    name: "movie-shawshank",
    url: "https://movie.douban.com/subject/1292052/",
  },
  {
    kind: "movie",
    name: "movie-wandering-earth-2",
    url: "https://movie.douban.com/subject/35267208/",
  },
  /* ── TV ── */
  {
    kind: "tv",
    name: "tv-got-s1",
    url: "https://movie.douban.com/subject/3016187/",
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
