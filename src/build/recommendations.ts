import { el } from "../components";
import { ICON_FILM_PLACEHOLDER } from "../constants";
import type { Recommendation } from "../types";
import { buildSectionHeader } from "./sections";

const buildRecs = (data: {
  recommendations: Recommendation[];
}): HTMLElement | null => {
  if (!data.recommendations?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-recs" });
  sec.append(buildSectionHeader("相似作品"));
  const grid = el("div", { className: "atv-recs" });
  for (const r of data.recommendations) {
    const card = el(r.link ? "a" : "div", { className: "atv-rec-card" });
    if (r.link && card instanceof HTMLAnchorElement) {
      card.href = r.link;
      card.target = "_blank";
      card.rel = "noopener";
    }
    const posterWrap = el("div", { className: "atv-rec-poster" });
    if (r.poster) {
      const img = el("img", { alt: r.title, src: r.poster });
      img.loading = "lazy";
      img.addEventListener(
        "error",
        () => {
          posterWrap.innerHTML = "";
          posterWrap.append(
            el("div", {
              className: "atv-poster-placeholder",
              html: ICON_FILM_PLACEHOLDER,
            })
          );
        },
        { once: true }
      );
      posterWrap.append(img);
    } else {
      posterWrap.append(
        el("div", {
          className: "atv-poster-placeholder",
          html: ICON_FILM_PLACEHOLDER,
        })
      );
    }
    card.append(posterWrap);
    card.append(el("div", { className: "atv-rec-title", text: r.title }));
    grid.append(card);
  }
  sec.append(grid);
  return sec;
};

export { buildRecs };
