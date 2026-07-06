import { el, renderStars } from "../../components";
import { LOGO_DOUBAN } from "../../constants";
import type { HeroData } from "../../types";
import { buildImdbRating } from "./imdb";
import { buildMcRating } from "./mc";
import { buildRtRating } from "./rt";

/* ── buildRatingPanel — Douban score + IMDb/RT skeleton ── */

const buildRatingPanel = (
  rating: HeroData["rating"],
  imdbId: string | null
): HTMLElement | null => {
  if (!rating && !imdbId) {
    return null;
  }

  const panel = el("div", { className: "atv-rating-panel" });

  /* ── Douban section ───────────────────────────── */
  const douban = el("div", { className: "atv-rating-panel-douban" });
  douban.append(
    el("div", { className: "atv-rating-panel-logo", html: LOGO_DOUBAN })
  );

  if (rating) {
    douban.append(
      el("div", {
        className: "atv-rating-panel-score",
        text: rating.score.toFixed(1),
      })
    );
    douban.append(renderStars(rating.score));
    const countTxt = rating.count
      ? `评价 ${rating.count.toLocaleString("en-US")}`
      : "已评分";
    douban.append(
      el("div", { className: "atv-rating-panel-count", text: countTxt })
    );
  } else {
    douban.append(
      el("div", { className: "atv-rating-empty", text: "暂无评分" })
    );
  }
  panel.append(douban);

  /* ── IMDb section (skeleton placeholder) ──────── */
  if (imdbId) {
    panel.append(buildImdbRating(null));
  }

  /* ── MC section (skeleton placeholder) ────────── */
  if (imdbId) {
    panel.append(buildMcRating(null));
  }

  /* ── RT section (skeleton placeholder) ────────── */
  if (imdbId) {
    panel.append(buildRtRating(null));
  }

  return panel;
};

export { buildRatingPanel };
