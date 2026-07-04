/* ── Series Builder ────────────────────────────────────── */
/* "同系列作品" carousel with Apple TV+ poster card style.  */

import { el } from "../components";
import { ICON_FILM_PLACEHOLDER } from "../constants";
import type { SeriesItem } from "../types";
import { buildSection } from "./sections";
import type { BuildSectionOptions } from "./sections";

type BuildSeriesOptions = {
  moreLink?: BuildSectionOptions["moreLink"];
};

/** Extract subject path from a Douban subject URL.
 *  e.g. "https://movie.douban.com/subject/26235354/" → "/subject/26235354/" */
const subjectPath = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const buildSeries = (
  items: SeriesItem[],
  options?: BuildSeriesOptions
): HTMLElement | null => {
  if (!items?.length) {
    return null;
  }

  const currentPath = window.location.pathname;
  const carousel = el("div", {
    className: "atv-carousel atv-series-carousel",
  });

  for (const s of items) {
    const isActive = s.link && subjectPath(s.link) === currentPath;
    const card = el(s.link ? "a" : "div", {
      className: ["atv-series-card", isActive ? "is-active" : ""].filter(
        Boolean
      ),
    });
    if (s.link && card instanceof HTMLAnchorElement) {
      card.href = s.link;
      card.target = "_blank";
      card.rel = "noopener";
    }

    /* ── Poster ────────────────────────────────────────── */
    const posterWrap = el("div", { className: "atv-series-poster" });
    if (s.poster) {
      const img = el("img", { alt: s.title, src: s.poster });
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

    /* ── Rating badge overlay ──────────────────────────── */
    if (s.rating) {
      posterWrap.append(
        el("span", {
          className: "atv-series-badge",
          text: s.rating,
        })
      );
    }

    card.append(posterWrap);

    /* ── Info row ──────────────────────────────────────── */
    const infoRow = el("div", { className: "atv-series-info" });
    infoRow.append(
      el("span", { className: "atv-series-title", text: s.title })
    );
    card.append(infoRow);
    carousel.append(card);
  }

  return buildSection("atv-series", "同系列作品", carousel, {
    moreLink: options?.moreLink,
  });
};

export { buildSeries };
export type { BuildSeriesOptions };
