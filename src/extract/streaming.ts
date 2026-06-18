/* ── Streaming / Interest Extractors ───────────────────── */
/* TV play sources, streaming watch links, interest buttons. */

import {
  RE_COLLECT,
  RE_COLLECT_EXACT,
  RE_DO,
  RE_DO_EXACT,
  RE_HTTP,
  RE_INTEREST_ACTIVE,
  RE_ONLINE_VIDEO,
  RE_PLAY_SOURCES,
  RE_SOURCES_SCRIPT,
  RE_WISH,
  RE_WISH_EXACT,
} from "../constants";
import type { InterestState, Streaming } from "../types";
import { $, $$ } from "../utils/dom";

const isRealUrl = (h: string) => RE_HTTP.test(h || "");

/**
 * Parse inline `<script>` blocks for TV play source data.
 * Matches `sources[N] = [{play_link: "URL"}]` assignments.
 *
 * CRITICAL: Regex logic must remain character-for-character — this was
 * a hard-fixed TV streaming feature.
 */
const parsePlaySources = (): Record<string, string> => {
  const scripts = $$("script:not([src])");
  const srcScript = scripts.find((s) =>
    RE_SOURCES_SCRIPT.test(s.textContent || "")
  );
  if (!srcScript) {
    return {};
  }
  const txt = srcScript.textContent;
  const map: Record<string, string> = {};
  let m = RE_PLAY_SOURCES.exec(txt);
  while (m) {
    const [, sourceId] = m;
    const playLink = m[2].replaceAll("&amp;", "&");
    if (!map[sourceId]) {
      map[sourceId] = playLink;
    }
    m = RE_PLAY_SOURCES.exec(txt);
  }
  return map;
};

/**
 * Extract streaming watch sources from DOM.
 *
 * Strategy:
 * 1. Look for `a.playBtn` elements (primary method)
 * 2. Fall back to `<a>` links matching `online-video` in href
 * 3. For TV pages, fall back to `parsePlaySources()` for inline data
 */
const extractStreaming = (): Streaming[] => {
  const seen = new Set<string>();
  const out: Streaming[] = [];
  const sourcesMap = parsePlaySources();

  const playBtns = $$<HTMLAnchorElement>("a.playBtn");
  for (const a of playBtns) {
    const name = (a.dataset.cn || a.textContent || "").trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    let { href } = a;
    if (!isRealUrl(href)) {
      const sourceId = a.dataset.source;
      if (sourceId && sourcesMap[sourceId]) {
        href = sourcesMap[sourceId];
      } else {
        continue;
      }
    }
    out.push({ href, name });
  }

  for (const a of $$<HTMLAnchorElement>("a")) {
    if (!RE_ONLINE_VIDEO.test(a.href || "")) {
      continue;
    }
    const name = (a.dataset.cn || a.textContent || "").trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    if (isRealUrl(a.href)) {
      out.push({ href: a.href, name });
    }
  }
  return out;
};

/**
 * Find wish (想看) and collect (看过) interest buttons.
 * Tries the primary interest section first, then falls back to secondary selectors.
 */
type InterestButtons = {
  do: HTMLAnchorElement | null;
  wish: HTMLAnchorElement | null;
  collect: HTMLAnchorElement | null;
};

const findInterestButtons = (): InterestButtons => {
  const result: InterestButtons = { collect: null, do: null, wish: null };
  const root = $("#interest_sect_level") || $("#interest_sectl");
  const anchors = root ? $$<HTMLAnchorElement>("a", root) : [];
  const scan = (
    list: HTMLAnchorElement[],
    doRe: RegExp,
    wishRe: RegExp,
    collectRe: RegExp
  ): void => {
    for (const a of list) {
      const t = (a.textContent || "").trim();
      if (!result.do && doRe.test(t)) {
        result.do = a;
      }
      if (!result.wish && wishRe.test(t)) {
        result.wish = a;
      }
      if (!result.collect && collectRe.test(t)) {
        result.collect = a;
      }
    }
  };
  scan(anchors, RE_DO, RE_WISH, RE_COLLECT);
  if (!result.do || !result.wish || !result.collect) {
    scan(
      $$<HTMLAnchorElement>("#interest_sectl a"),
      RE_DO_EXACT,
      RE_WISH_EXACT,
      RE_COLLECT_EXACT
    );
  }
  return result;
};

/**
 * Check if an interest button (wish/collect) is in active state.
 * Checks both the element and its parent for active classes.
 */
const isInterestActive = (anchor: HTMLAnchorElement | null): boolean => {
  if (!anchor) {
    return false;
  }
  const cls = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
  return RE_INTEREST_ACTIVE.test(cls);
};

const matchInterestText = (
  text: string,
  s3Only = false
): InterestState["status"] | null => {
  if (text.includes("已看过")) {
    return "collect";
  }
  if (text.includes("已想看")) {
    return "wish";
  }
  if (text.includes("已在看")) {
    return "do";
  }
  // S3 full text: "我看过这部电影" / "我看过这部电视剧"
  if (/^我看过(?:这部电影|这部电视剧)/u.test(text)) {
    return "collect";
  }
  if (/^我想看(?:这部电影|这部电视剧)/u.test(text)) {
    return "wish";
  }
  if (/^(?:我在看|我正在看)(?:这部电影|这部电视剧)?/u.test(text)) {
    return "do";
  }
  // S1/S2 anchor text — only match for S2 detection, NOT for S3
  if (!s3Only) {
    if (/^看过$/u.test(text)) {
      return "collect";
    }
    if (/^想看$/u.test(text)) {
      return "wish";
    }
    if (/^(?:正在?)?在看$/u.test(text)) {
      return "do";
    }
  }
  return null;
};

const detectS3State = (
  root: HTMLElement
): {
  status: InterestState["status"];
  rating: number;
  date: string;
  hasWatching: boolean;
  comment: string;
} => {
  let status: InterestState["status"] = "none";
  const allTextEls = root.querySelectorAll<HTMLElement>("span, div, a");
  for (const el of allTextEls) {
    const t = (el.textContent || "").trim();
    const s = matchInterestText(t, true);
    if (s) {
      status = s;
      break;
    }
  }

  const hasWatching = [...allTextEls].some((el) =>
    /^(?:正在?)?在看/u.test((el.textContent || "").trim())
  );

  const ratingInput = root.querySelector<HTMLInputElement>("#n_rating");
  const rating = ratingInput ? Number.parseInt(ratingInput.value, 10) : 0;

  const dateEl = root.querySelector<HTMLElement>(".collection_date");
  const date = dateEl ? (dateEl.textContent || "").trim() : "";

  // User's short review: the bare <span> inside .j a_stars after #rating
  const commentEl = root.querySelector<HTMLElement>(
    ".j.a_stars > span:not(.mr10):not(#rating)"
  );
  const comment = commentEl ? (commentEl.textContent || "").trim() : "";

  return { comment, date, hasWatching, rating, status };
};

const detectS2Status = (
  anchors: HTMLAnchorElement[]
): { status: InterestState["status"]; hasWatching: boolean } => {
  let status: InterestState["status"] = "none";
  let hasWatching = false;
  for (const a of anchors) {
    const text = (a.textContent || "").trim();
    if (text === "在看") {
      hasWatching = true;
    }
    if (status !== "none") {
      continue;
    }
    const s = matchInterestText(text);
    if (s) {
      const cls = `${a.className} ${a.parentElement?.className || ""}`;
      if (RE_INTEREST_ACTIVE.test(cls)) {
        status = s;
      }
    }
  }
  return { hasWatching, status };
};

const extractInterestState = (): InterestState => {
  const ck = (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";
  const loggedIn = !!ck;
  const root = $("#interest_sect_level") || $("#interest_sectl");
  const anchors = root ? $$<HTMLAnchorElement>("a", root) : [];

  if (!loggedIn) {
    return {
      ck,
      comment: "",
      date: "",
      hasWatching: anchors.some((a) =>
        /^在看$/u.test((a.textContent || "").trim())
      ),
      loggedIn: false,
      marked: false,
      rating: 0,
      status: "none",
      tags: [],
    };
  }

  if (root) {
    const s3 = detectS3State(root as HTMLElement);
    if (s3.status !== "none") {
      return {
        ck,
        comment: s3.comment,
        date: s3.date,
        hasWatching: s3.hasWatching,
        loggedIn: true,
        marked: true,
        rating: s3.rating,
        status: s3.status,
        tags: [],
      };
    }
  }

  const s2 = detectS2Status(anchors);
  return {
    ck,
    comment: "",
    date: "",
    hasWatching: s2.hasWatching,
    loggedIn: true,
    marked: false,
    rating: 0,
    status: s2.status,
    tags: [],
  };
};

/* ── Exports ──────────────────────────────────────────── */

export {
  extractInterestState,
  extractStreaming,
  findInterestButtons,
  isInterestActive,
  parsePlaySources,
};
