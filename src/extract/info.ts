/* ── extractInfo() — the #info block ───────────────────── */
/* Directors, writers, cast, genres, country, language,     */
/* dates, runtime, episodes, seasons, aliases, IMDb.        */

import {
  RE_COLON_WS,
  RE_IMDB_ID,
  RE_SLASH_SEP,
  RE_WS_GLOBAL,
} from "@/constants";
import type { InfoBlock } from "@/types";
import { $, $$ } from "@/utils/dom";

type Person = InfoBlock["director"][number];

const findLabel = (root: HTMLElement, label: string): HTMLElement | null => {
  const labels = $$<HTMLSpanElement>("span.pl", root);
  for (const candidate of labels) {
    const text = (candidate.textContent || "").replace(RE_COLON_WS, "");
    if (text === label) {
      return candidate;
    }
  }
  return null;
};

const adjacentSiblings = (label: HTMLElement): ChildNode[] => {
  const siblings: ChildNode[] = [];
  let current: ChildNode | null = label.nextSibling;
  while (current) {
    if (
      current.nodeType === 1 &&
      ((current as HTMLElement).classList?.contains("pl") ||
        (current as HTMLElement).tagName === "BR")
    ) {
      break;
    }
    siblings.push(current);
    current = current.nextSibling;
  }
  return siblings;
};

const collectInfoTextAfter = (root: HTMLElement, label: string): string => {
  const labelElement = findLabel(root, label);
  if (!labelElement) {
    return "";
  }
  return adjacentSiblings(labelElement)
    .map((sibling) => {
      if (sibling.nodeType === 3) {
        return sibling.nodeValue || "";
      }
      return sibling.nodeType === 1 ? sibling.textContent || "" : "";
    })
    .join("")
    .replace(RE_SLASH_SEP, " / ")
    .replace(RE_WS_GLOBAL, " ")
    .trim();
};

const collectLinksAfter = (root: HTMLElement, label: string): Person[] => {
  const labelElement = findLabel(root, label);
  if (!labelElement) {
    return [];
  }
  return adjacentSiblings(labelElement).flatMap((sibling) => {
    if (sibling.nodeType !== 1) {
      return [];
    }
    const element = sibling as HTMLElement;
    const anchors: HTMLAnchorElement[] =
      element.tagName === "A"
        ? [element as HTMLAnchorElement]
        : $$<HTMLAnchorElement>("a", element);
    return anchors.flatMap((anchor) => {
      if (anchor.classList.contains("more-attrs")) {
        return [];
      }
      const text = (anchor.textContent || "").trim();
      return text ? [{ href: anchor.href || "", text }] : [];
    });
  });
};

/**
 * Extract all metadata fields from the #info block.
 * Handles both movie and TV detail pages.
 */
const extractInfo = (doc: Document): InfoBlock => {
  const info = $<HTMLElement>("#info", doc);
  const out: InfoBlock = {
    aliases: "",
    cast: [],
    country: "",
    director: [],
    episodeRuntime: "",
    episodes: "",
    firstAired: "",
    genres: [],
    imdb: "",
    language: "",
    releaseDate: "",
    runtime: "",
    seasons: "",
    writers: [],
  };
  if (!info) {
    return out;
  }

  /* ---- Director / Writers ---- */
  out.director = collectLinksAfter(info, "导演");
  out.writers = collectLinksAfter(info, "编剧");

  /* ---- Cast (v:starring or label fallback) ---- */
  const starringEls = $$<HTMLAnchorElement>('a[rel="v:starring"]', info);
  out.cast = starringEls.length
    ? starringEls
        .map((a) => ({
          href: a.href || "",
          text: (a.textContent || "").trim(),
        }))
        .filter((x) => x.text)
    : collectLinksAfter(info, "主演");

  /* ---- Genres ---- */
  const genreEls = $$('span[property="v:genre"]', info);
  out.genres = genreEls
    .map((e) => (e.textContent || "").trim())
    .filter(Boolean);

  /* ---- Country / Language ---- */
  out.country = collectInfoTextAfter(info, "制片国家/地区");
  out.language = collectInfoTextAfter(info, "语言");

  /* ---- Release date ---- */
  const relEls = $$('span[property="v:initialReleaseDate"]', info);
  if (relEls.length) {
    out.releaseDate = relEls
      .map((e) => (e.textContent || "").trim())
      .filter(Boolean)
      .join(" / ");
  }

  /* ---- First aired (TV) ---- */
  out.firstAired = collectInfoTextAfter(info, "首播");

  /* ---- Runtime ---- */
  const runEls = $$('span[property="v:runtime"]', info);
  if (runEls.length) {
    out.runtime = runEls
      .map((e) => (e.textContent || "").trim())
      .filter(Boolean)
      .join(" / ");
  }

  /* ---- Episodes (TV) ---- */
  out.episodes = collectInfoTextAfter(info, "集数");

  /* ---- Seasons (TV, with <select> handling) ---- */
  const seasonL = findLabel(info, "季数");
  if (seasonL) {
    const sel = $<HTMLSelectElement>("#season", info);
    if (sel) {
      const opt = sel.options[sel.selectedIndex];
      out.seasons = opt
        ? (opt.textContent || "").trim()
        : collectInfoTextAfter(info, "季数");
    } else {
      out.seasons = collectInfoTextAfter(info, "季数");
    }
  }

  /* ---- Episode runtime (TV) ---- */
  out.episodeRuntime = collectInfoTextAfter(info, "单集片长");

  /* ---- Aliases ---- */
  out.aliases = collectInfoTextAfter(info, "又名");

  /* ---- IMDb ---- */
  const imdbL = findLabel(info, "IMDb");
  if (imdbL) {
    const raw = collectInfoTextAfter(info, "IMDb");
    const m = raw.match(RE_IMDB_ID);
    out.imdb = m ? m[1] : raw;
  }

  return out;
};

/* ── Exports ──────────────────────────────────────────── */

export { extractInfo };
