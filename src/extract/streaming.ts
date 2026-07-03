/* ── Streaming Source Extractor ──────────────────────── */
/* TV play sources and streaming watch links. */

import {
  RE_HTTP,
  RE_ONLINE_VIDEO,
  RE_PLAY_SOURCES,
  RE_SOURCES_SCRIPT,
} from "../constants";
import type { Streaming } from "../types";
import { $$ } from "../utils/dom";

const isRealUrl = (h: string) => RE_HTTP.test(h || "");

/**
 * Parse inline `<script>` blocks for TV play source data.
 * Matches `sources[N] = [{play_link: "URL"}]` assignments.
 *
 * CRITICAL: Regex logic must remain character-for-character — this was
 * a hard-fixed TV streaming feature.
 */
const parsePlaySources = (doc: Document): Record<string, string> => {
  const scripts = $$("script:not([src])", doc);
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
const extractStreaming = (doc: Document): Streaming[] => {
  const seen = new Set<string>();
  const out: Streaming[] = [];
  const sourcesMap = parsePlaySources(doc);

  const playBtns = $$<HTMLAnchorElement>("a.playBtn", doc);
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

  for (const a of $$<HTMLAnchorElement>("a", doc)) {
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

/* ── Exports ────────────────────────────────────────── */

export { extractStreaming, parsePlaySources };
