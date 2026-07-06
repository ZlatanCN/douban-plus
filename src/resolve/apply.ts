/* ── DOM Appliers — Rating Resolution → DOM Update ────── */
/* Each function takes a resolved rating and updates its DOM panel.
 * These are the "output side" of the rating resolution seam. */

import type { FetchImdbResult } from "../api/imdb";
import { buildImdbRating, buildMcRating, buildRtRating } from "../build";
import type { McRating, RtRating } from "../types";

const applyImdbResult = (result: FetchImdbResult | null): void => {
  const section = document.querySelector<HTMLElement>(".atv-rating-panel-imdb");
  if (!section) {
    return;
  }
  if (result?.rating) {
    const loaded = buildImdbRating(result.rating);
    section.replaceWith(loaded);
  } else {
    section.classList.remove("is-loading");
    section.classList.add("is-empty");
  }
};

const applyRtResult = (rating: RtRating | null): void => {
  const section = document.querySelector<HTMLElement>(".atv-rating-panel-rt");
  if (!section) {
    return;
  }
  if (rating) {
    const loaded = buildRtRating(rating);
    section.replaceWith(loaded);
  } else {
    section.classList.remove("is-loading");
    section.classList.add("is-empty");
  }
};

const applyMcResult = (rating: McRating | null): void => {
  const section = document.querySelector<HTMLElement>(".atv-rating-panel-mc");
  if (!section) {
    return;
  }
  if (rating) {
    const loaded = buildMcRating(rating);
    section.replaceWith(loaded);
  } else {
    section.classList.remove("is-loading");
    section.classList.add("is-empty");
  }
};

export { applyImdbResult, applyMcResult, applyRtResult };
