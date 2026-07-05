import { el } from "../../components";
import { RE_SEASON_SUFFIX } from "../../constants";
import type { HeroData } from "../../types";

/* ── buildMeta — year, TV/season/episode, country, genres ─ */

const buildMeta = (data: HeroData): HTMLElement => {
  const meta = el("div", { className: "atv-hero-meta" });
  const metaParts: string[] = [];
  if (data.year) {
    metaParts.push(data.year);
  }
  if (data.isTV) {
    const seg: string[] = [];
    if (data.info.seasons) {
      seg.push(
        data.info.seasons +
          (RE_SEASON_SUFFIX.test(data.info.seasons) ? "季" : "")
      );
    }
    if (data.info.episodes) {
      seg.push(
        data.info.episodes +
          (RE_SEASON_SUFFIX.test(data.info.episodes) ? "集" : "")
      );
    }
    if (seg.length) {
      metaParts.push(seg.join(" · "));
    } else if (data.info.episodeRuntime) {
      metaParts.push(data.info.episodeRuntime);
    }
  } else if (data.info.runtime) {
    metaParts.push(data.info.runtime);
  }
  if (data.info.country) {
    metaParts.push(data.info.country);
  }
  for (const part of metaParts) {
    meta.append(el("span", { className: "atv-meta-dot", text: part }));
  }
  if (data.info.genres?.length) {
    const chips = el("span", { className: "atv-meta-chips" });
    for (const g of data.info.genres) {
      chips.append(el("span", { className: "atv-chip", text: g }));
    }
    meta.append(chips);
  }
  return meta;
};

export { buildMeta };
