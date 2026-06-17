import { el } from "../components/dom-factory";
import { ICON_FILM_PLACEHOLDER } from "../constants";
import { buildSectionHeader } from "./sections";
import type { Recommendation } from "../types";

function buildRecs(data: { recommendations: Recommendation[] }): HTMLElement | null {
  if (!data.recommendations?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-recs" });
  sec.appendChild(buildSectionHeader("相似作品"));
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
      const img = el("img", { src: r.poster, alt: r.title });
      img.loading = "lazy";
      img.onerror = () => {
        posterWrap.innerHTML = "";
        posterWrap.appendChild(
          el("div", {
            className: "atv-poster-placeholder",
            html: ICON_FILM_PLACEHOLDER,
          })
        );
      };
      posterWrap.appendChild(img);
    } else {
      posterWrap.appendChild(
        el("div", {
          className: "atv-poster-placeholder",
          html: ICON_FILM_PLACEHOLDER,
        })
      );
    }
    card.appendChild(posterWrap);
    card.appendChild(
      el("div", { className: "atv-rec-title", text: r.title })
    );
    grid.appendChild(card);
  }
  sec.appendChild(grid);
  return sec;
}

export { buildRecs };
