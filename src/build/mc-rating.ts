import { el } from "../components";
import { LOGO_METACRITIC } from "../constants";
import type { McRating } from "../types";

/* ── MC Rating Panel Section ──────────────────── */

/** Thresholds per Metacritic's score index — see
 *  en.wikipedia.org/wiki/Metacritic#Metascores */
const mcWordRatingChinese = (score: number): string => {
  if (score >= 81) {
    return "普遍赞誉";
  }
  if (score >= 61) {
    return "大体好评";
  }
  if (score >= 40) {
    return "褒贬不一";
  }
  if (score >= 20) {
    return "大体差评";
  }
  return "普遍差评";
};

/** Score color for the traffic-light system.
 *  Green ≥61 (positive), yellow 40–60 (mixed), red <40 (negative).
 *  Same thresholds as mcWordRating so color and label never disagree. */
const scoreClass = (score: number): string => {
  if (score >= 61) {
    return "is-high";
  }
  if (score >= 40) {
    return "is-medium";
  }
  return "is-low";
};

const buildMcRating = (rating: McRating | null): HTMLElement => {
  const section = el("div", { className: "atv-rating-panel-mc" });

  section.append(
    el("div", { className: "atv-rating-panel-logo", html: LOGO_METACRITIC })
  );

  if (!rating) {
    section.classList.add("is-loading");
    section.append(el("div", { className: "atv-rating-panel-skeleton" }));
    return section;
  }

  section.classList.add("is-loaded");
  section.append(
    el("div", {
      className: `atv-rating-panel-score ${scoreClass(rating.score)}`,
      text: String(rating.score),
    })
  );

  /* MC — score bar + Chinese word label (replaces RT icons) */
  const barWidth = Math.min(100, rating.score);
  section.append(
    el("div", { className: "atv-mc-label-row" }, [
      el("span", { className: "atv-mc-bar-track" }, [
        el("span", {
          className: `atv-mc-bar-fill ${scoreClass(rating.score)}`,
          style: { width: `${barWidth}%` },
        }),
      ]),
      el("span", {
        className: "atv-mc-word-label",
        text: mcWordRatingChinese(rating.score),
      }),
    ])
  );

  const countTxt = rating.reviewCount
    ? `评价 ${rating.reviewCount.toLocaleString("en-US")}`
    : "已评分";
  section.append(
    el("div", { className: "atv-rating-panel-count", text: countTxt })
  );

  return section;
};

export { buildMcRating };
