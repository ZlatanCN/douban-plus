import { el, openPosterModal } from "../../components";
import { ICON_FILM_PLACEHOLDER } from "../../constants";
import type { HeroData } from "../../types";

/* ── buildPosterCard ──────────────────────────────────── */

const buildPosterCard = (data: HeroData): HTMLElement => {
  const card = el("div", { className: "atv-poster-card" });
  if (data.poster) {
    const img = el("img", {
      alt: data.title.primary || "",
      src: data.poster,
    });
    img.addEventListener("error", (e) => {
      console.error("[buildHero] Poster card img FAILED:", data.poster, e);
      card.innerHTML = "";
      const ph = el("div", {
        className: "atv-poster-placeholder",
        html: ICON_FILM_PLACEHOLDER,
      });
      card.append(ph);
    });
    card.append(img);
  } else {
    card.append(
      el("div", {
        className: "atv-poster-placeholder",
        html: ICON_FILM_PLACEHOLDER,
      })
    );
  }
  card.addEventListener("click", () => {
    if (data.poster) {
      openPosterModal(data.poster, data.title.primary || "");
    }
  });
  return card;
};

export { buildPosterCard };
