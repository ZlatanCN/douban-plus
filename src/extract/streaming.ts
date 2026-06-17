/* ── Streaming / Interest Extractors ───────────────────── */
/* TV play sources, streaming watch links, interest buttons. */

import {
  RE_COLLECT,
  RE_COLLECT_EXACT,
  RE_HTTP,
  RE_INTEREST_ACTIVE,
  RE_ONLINE_VIDEO,
  RE_PLAY_SOURCES,
  RE_SOURCES_SCRIPT,
  RE_WISH,
  RE_WISH_EXACT,
} from "../constants";
import type { Streaming } from "../types";
import { $, $$ } from "../utils/dom";

/**
 * Parse inline `<script>` blocks for TV play source data.
 * Matches `sources[N] = [{play_link: "URL"}]` assignments.
 *
 * CRITICAL: Regex logic must remain character-for-character — this was
 * a hard-fixed TV streaming feature.
 */
function parsePlaySources(): Record<string, string> {
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
    const sourceId = m[1];
    const playLink = m[2].replace(/&amp;/g, "&");
    if (!map[sourceId]) {
      map[sourceId] = playLink;
    }
    m = RE_PLAY_SOURCES.exec(txt);
  }
  return map;
}

/**
 * Extract streaming watch sources from DOM.
 *
 * Strategy:
 * 1. Look for `a.playBtn` elements (primary method)
 * 2. Fall back to `<a>` links matching `online-video` in href
 * 3. For TV pages, fall back to `parsePlaySources()` for inline data
 */
function extractStreaming(): Streaming[] {
  const seen = new Set<string>();
  const out: Streaming[] = [];
  const isRealUrl = (h: string) => RE_HTTP.test(h || "");
  const sourcesMap = parsePlaySources();

  const playBtns = $$<HTMLAnchorElement>("a.playBtn");
  for (const a of playBtns) {
    const name = (a.getAttribute("data-cn") || a.textContent || "").trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    let href = a.href;
    if (!isRealUrl(href)) {
      const sourceId = a.getAttribute("data-source");
      if (sourceId && sourcesMap[sourceId]) {
        href = sourcesMap[sourceId];
      } else {
        continue;
      }
    }
    out.push({ name, href });
  }

  for (const a of $$<HTMLAnchorElement>("a")) {
    if (!RE_ONLINE_VIDEO.test(a.href || "")) {
      continue;
    }
    const name = (a.getAttribute("data-cn") || a.textContent || "").trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    if (isRealUrl(a.href)) {
      out.push({ name, href: a.href });
    }
  }
  return out;
}

/**
 * Find wish (想看) and collect (看过) interest buttons.
 * Tries the primary interest section first, then falls back to secondary selectors.
 */
function findInterestButtons(): {
  wish: HTMLAnchorElement | null;
  collect: HTMLAnchorElement | null;
} {
  const result: {
    wish: HTMLAnchorElement | null;
    collect: HTMLAnchorElement | null;
  } = { wish: null, collect: null };
  const root = $("#interest_sect_level") || $("#interest_sectl");
  const anchors = root ? $$<HTMLAnchorElement>("a", root) : [];
  for (const a of anchors) {
    const t = (a.textContent || "").trim();
    if (!result.wish && RE_WISH.test(t)) {
      result.wish = a;
    }
    if (!result.collect && RE_COLLECT.test(t)) {
      result.collect = a;
    }
  }
  if (!(result.wish && result.collect)) {
    const all = $$<HTMLAnchorElement>("#interest_sectl a");
    for (const a of all) {
      const t = (a.textContent || "").trim();
      if (!result.wish && RE_WISH_EXACT.test(t)) {
        result.wish = a;
      }
      if (!result.collect && RE_COLLECT_EXACT.test(t)) {
        result.collect = a;
      }
    }
  }
  return result;
}

/**
 * Check if an interest button (wish/collect) is in active state.
 * Checks both the element and its parent for active classes.
 */
function isInterestActive(anchor: HTMLAnchorElement | null): boolean {
  if (!anchor) {
    return false;
  }
  const cls = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
  return RE_INTEREST_ACTIVE.test(cls);
}

/* ── Exports ──────────────────────────────────────────── */

export {
  extractStreaming,
  findInterestButtons,
  isInterestActive,
  parsePlaySources,
};
