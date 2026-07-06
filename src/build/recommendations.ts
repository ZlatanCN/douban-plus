import { el } from "../components";
import { buildSection } from "../components/sections";
import { ICON_FILM_PLACEHOLDER } from "../constants";
import type { Recommendation } from "../types";

const buildRecs = (recommendations: Recommendation[]): HTMLElement | null => {
  if (!recommendations?.length) {
    return null;
  }
  const grid = el("div", { className: "atv-recs" });
  for (const r of recommendations) {
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
  return buildSection("atv-recs", "相似作品", grid);
};

export { buildRecs };
