import { el, renderStars } from "../../components";
import { LOGO_IMDB } from "../../constants";
import type { ImdbRating } from "../../types";

/* ── IMDb Rating Panel Section ──────────────────── */

const buildImdbRating = (rating: ImdbRating | null): HTMLElement => {
  const section = el("div", { className: "atv-rating-panel-imdb" });

  section.append(
    el("div", { className: "atv-rating-panel-logo", html: LOGO_IMDB })
  );

  if (!rating) {
    section.classList.add("is-loading");
    section.append(el("div", { className: "atv-rating-panel-skeleton" }));
    return section;
  }

  section.classList.add("is-loaded");
  section.append(
    el("div", {
      className: "atv-rating-panel-score",
      text: rating.score.toFixed(1),
    })
  );

  section.append(renderStars(rating.score));
  const countTxt = rating.count
    ? `评价 ${rating.count.toLocaleString("en-US")}`
    : "已评分";
  section.append(
    el("div", { className: "atv-rating-panel-count", text: countTxt })
  );

  return section;
};

export { buildImdbRating };
