/* ── extractInfo() — the #info block ───────────────────── */
/* Directors, writers, cast, genres, country, language,     */
/* dates, runtime, episodes, seasons, aliases, IMDb.        */

import { RE_IMDB_ID } from "../constants";
import type { InfoBlock } from "../types";
import { $, $$ } from "../utils/dom";
import { collectInfoTextAfter, collectLinksAfter, findLabel } from "./helpers";

/**
 * Extract all metadata fields from the #info block.
 * Handles both movie and TV detail pages.
 */
const extractInfo = (): InfoBlock => {
  const info = $<HTMLElement>("#info");
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
