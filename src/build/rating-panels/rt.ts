import { el } from "../../components";
import { ICON_POPCORN, ICON_TOMATO, LOGO_RT } from "../../constants";
import type { RtRating } from "../../types";

/* ── Rotten Tomatoes Rating Panel Section ─────────── */

const isFresh = (score: number): boolean => score >= 60;

const buildLabel = (
  score: number,
  iconSvg: string,
  text: string,
  cls: string
): HTMLElement => {
  const item = el("span", { className: `atv-rt-label-item ${cls}` });
  item.classList.add(isFresh(score) ? "is-fresh" : "is-rotten");
  item.append(
    el("span", { className: "atv-rt-score-icon", html: iconSvg }),
    el("span", { className: "atv-rt-score-label", text })
  );
  return item;
};

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

  /* ── Score row (two values side by side) ─────── */
  const scoreRow = el("div", { className: "atv-rt-score-row" });
  scoreRow.append(
    el("div", {
      className: `atv-rt-score-value ${isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"}`,
      text: `${String(rating.criticsScore)}%`,
    }),
    el("div", { className: "atv-rt-divider" }),
    el("div", {
      className: `atv-rt-score-value ${isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"}`,
      text: `${String(rating.audienceScore)}%`,
    })
  );
  section.append(scoreRow);

  /* ── Label row (icons + text side by side) ───── */
  const labelRow = el("div", { className: "atv-rt-label-row" });
  labelRow.append(
    buildLabel(rating.criticsScore, ICON_TOMATO, "影评人", "is-critics"),
    buildLabel(rating.audienceScore, ICON_POPCORN, "观众", "is-audience")
  );
  section.append(labelRow);

  /* ── Count row (e.g. 评价 300 · 50,000) ──────── */
  const criticsCountStr = rating.criticsCount.toLocaleString("en-US");
  const audienceCountStr = rating.audienceCount.toLocaleString("en-US");
  const countRow = el("div", { className: "atv-rt-count-row" });
  countRow.append(
    el("span", {
      className: "atv-rt-count-value",
      text: `评价 ${criticsCountStr}`,
    }),
    el("span", {
      className: "atv-rt-count-value",
      text: `评价 ${audienceCountStr}`,
    })
  );
  section.append(countRow);

  return section;
};

export { buildRtRating };
