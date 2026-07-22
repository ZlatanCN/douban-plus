/* ── Streaming Source Extractor ──────────────────────── */
/* TV play sources and streaming watch links. */

import {
  RE_HTTP,
  RE_ONLINE_VIDEO,
  RE_PLAY_SOURCES,
  RE_SOURCES_SCRIPT,
} from "@/modules/subject/constants";
import type { Streaming } from "@/modules/subject/domain";
import { $$ } from "@/shared/utils/dom";

const isRealUrl = (href: string): boolean => RE_HTTP.test(href);

/**
 * Parse inline `<script>` blocks for TV play source data.
 * Matches `sources[N] = [{play_link: "URL"}]` assignments.
 *
 * CRITICAL: Regex logic must remain character-for-character — this was
 * a hard-fixed TV streaming feature.
 */
const parseLegacyPlaySources = (doc: Document): Record<string, string> => {
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
    const [, sourceId, playLink] = m;
    if (!sourceId || !playLink) {
      m = RE_PLAY_SOURCES.exec(txt);
      continue;
    }
    const decodedPlayLink = playLink.replaceAll("&amp;", "&");
    if (!map[sourceId]) {
      map[sourceId] = decodedPlayLink;
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
 * 3. For TV pages, resolve legacy inline play-source data
 */
const extractStreaming = (doc: Document): Streaming[] => {
  const seen = new Set<string>();
  const out: Streaming[] = [];
  const sourcesMap = parseLegacyPlaySources(doc);

  const playBtns = $$<HTMLAnchorElement>("a.playBtn", doc);
  for (const a of playBtns) {
    const name = (a.dataset.cn || a.textContent || "").trim();
    if (!name || seen.has(name)) {
      continue;
    }
    let { href } = a;
    if (!isRealUrl(href)) {
      const sourceId = a.dataset.source;
      const mappedHref = sourceId ? sourcesMap[sourceId] : undefined;
      if (!mappedHref || !isRealUrl(mappedHref)) {
        continue;
      }
      href = mappedHref;
    }
    seen.add(name);
    const iconUrl = a.dataset.pic;
    out.push({ href, ...(iconUrl ? { iconUrl } : {}), name });
  }

  for (const a of $$<HTMLAnchorElement>("a", doc)) {
    if (!RE_ONLINE_VIDEO.test(a.href || "")) {
      continue;
    }
    const name = (a.dataset.cn || a.textContent || "").trim();
    if (!name || seen.has(name) || !isRealUrl(a.href)) {
      continue;
    }
    seen.add(name);
    out.push({ href: a.href, name });
  }
  return out;
};

/* ── Exports ────────────────────────────────────────── */

export { extractStreaming };
