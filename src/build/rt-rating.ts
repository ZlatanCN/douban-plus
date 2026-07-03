import { el } from "../components";
import { LOGO_RT } from "../constants";
import type { RtRating } from "../types";

/* ── Rotten Tomatoes Rating Panel Section ─────────── */

const buildRtRating = (rating: RtRating | null): HTMLElement => {
  const section = el("div", { className: "atv-rating-panel-rt" });

  section.append(
    el("div", { className: "atv-rating-panel-logo", html: LOGO_RT })
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
      text: `${rating.score}%`,
    })
  );

  const detail = el("div", { className: "atv-rating-panel-detail" });
  const countTxt = rating.count
    ? `${rating.count.toLocaleString("en-US")} 评论`
    : "";
  if (countTxt) {
    detail.append(
      el("div", { className: "atv-rating-panel-count", text: countTxt })
    );
  }
  section.append(detail);

  return section;
};

export { buildRtRating };
