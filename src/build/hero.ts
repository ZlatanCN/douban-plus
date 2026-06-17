import { el, renderStars } from "../components/dom-factory";
import { openPosterModal } from "../components/modal";
import {
  ICON_CHECK,
  ICON_CHEVRON,
  ICON_FILM_PLACEHOLDER,
  ICON_PLAY,
  RE_SEASON_SUFFIX,
} from "../constants";
import { findInterestButtons, isInterestActive } from "../extract/streaming";
import type { DoubanData, Photo } from "../types";
import { hashStr } from "../utils/hash";

/* ── Hero Banner UI Builders ─────────────────────────── */

/**
 * Deterministically pick a background still from photos array using hash.
 */
const pickStill = (photos: Photo[], seed: string): Photo | null => {
  if (!photos?.length) {
    return null;
  }
  const idx = hashStr(String(seed || "")) % photos.length;
  return photos[idx];
};

/**
 * Build the hero background: gradient overlay + blurred still image
 * with progressive loading (thumb → HD).
 */
const buildHeroBg = (data: DoubanData): HTMLElement => {
  const bg = el("div", { className: "atv-hero-bg" });
  const still = pickStill(data.photos, data.subjectId);

  if (still?.hdUrl) {
    const thumb = el("div", { className: "atv-hero-still is-thumb" });
    thumb.style.backgroundImage = `url("${encodeURI(still.thumbUrl || still.hdUrl)}")`;
    bg.append(thumb);

    const hd = el("div", { className: "atv-hero-still is-hd" });
    hd.setAttribute("aria-hidden", "true");
    bg.append(hd);

    const loader = new Image();
    loader.addEventListener(
      "load",
      () => {
        hd.style.backgroundImage = `url("${encodeURI(still.hdUrl)}")`;
        requestAnimationFrame(() => hd.classList.add("is-loaded"));
      },
      { once: true }
    );
    loader.addEventListener(
      "error",
      (e) => {
        console.error("[Hero] HD still FAILED:", still.hdUrl, e);
        if (still.thumbUrl && still.thumbUrl !== still.hdUrl) {
          hd.style.backgroundImage = `url("${encodeURI(still.thumbUrl)}")`;
          requestAnimationFrame(() => hd.classList.add("is-loaded"));
        }
      },
      { once: true }
    );
    loader.src = still.hdUrl;
    return bg;
  }

  if (data.poster) {
    const poster = el("div", { className: "atv-hero-still is-poster" });
    poster.style.backgroundImage = `url("${encodeURI(data.poster)}")`;
    bg.append(poster);
    return bg;
  }

  bg.style.background =
    "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)";
  return bg;
};

const buildPosterCard = (data: DoubanData): HTMLElement => {
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

const buildMeta = (data: DoubanData): HTMLElement => {
  const meta = el("div", { className: "atv-hero-meta" });
  const metaParts: string[] = [];
  if (data.year) {
    metaParts.push(data.year);
  }
  if (data.isTV) {
    const seg: string[] = [];
    if (data.info.seasons) {
      seg.push(
        data.info.seasons +
          (RE_SEASON_SUFFIX.test(data.info.seasons) ? "季" : "")
      );
    }
    if (data.info.episodes) {
      seg.push(
        data.info.episodes +
          (RE_SEASON_SUFFIX.test(data.info.episodes) ? "集" : "")
      );
    }
    if (seg.length) {
      metaParts.push(seg.join(" · "));
    } else if (data.info.episodeRuntime) {
      metaParts.push(data.info.episodeRuntime);
    }
  } else if (data.info.runtime) {
    metaParts.push(data.info.runtime);
  }
  if (data.info.country) {
    metaParts.push(data.info.country);
  }
  for (const part of metaParts) {
    meta.append(el("span", { className: "atv-meta-dot", text: part }));
  }
  if (data.info.genres?.length) {
    const chips = el("span", { className: "atv-meta-chips" });
    for (const g of data.info.genres) {
      chips.append(el("span", { className: "atv-chip", text: g }));
    }
    meta.append(chips);
  }
  return meta;
};

const buildRatingRow = (data: DoubanData): HTMLElement => {
  const ratingRow = el("div", { className: "atv-rating-row" });
  if (data.rating) {
    ratingRow.append(
      el("div", {
        className: "atv-rating-score",
        text: data.rating.score.toFixed(1),
      })
    );
    const ratingMeta = el("div", { className: "atv-rating-meta" });
    ratingMeta.append(renderStars(data.rating.score));
    const countTxt = data.rating.count
      ? `评价 ${data.rating.count.toLocaleString("en-US")}`
      : "已评分";
    ratingMeta.append(
      el("div", { className: "atv-rating-count", text: countTxt })
    );
    ratingRow.append(ratingMeta);
  } else {
    ratingRow.append(
      el("div", { className: "atv-rating-empty", text: "暂无评分" })
    );
  }
  return ratingRow;
};

/**
 * Build the entire hero banner section — poster card, title, meta chips,
 * rating row, wish/seen buttons, summary teaser, and background.
 */
const buildHero = (data: DoubanData): HTMLElement => {
  const hero = el("section", { className: "atv-hero" });

  hero.append(buildHeroBg(data));
  hero.append(el("div", { className: "atv-hero-vignette" }));
  hero.append(el("div", { className: "atv-hero-overlay-x" }));
  hero.append(el("div", { className: "atv-hero-overlay-y" }));

  const inner = el("div", { className: "atv-hero-inner" });

  inner.append(buildPosterCard(data));

  const info = el("div", { className: "atv-hero-info" });

  const title = el("h1", {
    className: "atv-hero-title",
    text: data.title.primary || data.title.full,
  });
  info.append(title);
  if (data.title.original) {
    info.append(
      el("div", { className: "atv-hero-orig", text: data.title.original })
    );
  }

  info.append(buildMeta(data));
  info.append(buildRatingRow(data));

  const actions = el("div", { className: "atv-actions" });
  const interest = findInterestButtons();
  const wishBtn = el("button", {
    attrs: { type: "button" },
    className: "atv-btn atv-btn-primary",
  });
  wishBtn.append(el("span", { html: ICON_PLAY }));
  wishBtn.append(el("span", { text: "想看" }));
  if (isInterestActive(interest.wish)) {
    wishBtn.classList.add("is-active");
  }
  wishBtn.addEventListener("click", () => {
    if (interest.wish) {
      interest.wish.click();
    }
  });
  actions.append(wishBtn);

  const seenBtn = el("button", {
    attrs: { type: "button" },
    className: "atv-btn atv-btn-secondary",
  });
  seenBtn.append(el("span", { html: ICON_CHECK }));
  seenBtn.append(el("span", { text: "看过" }));
  if (isInterestActive(interest.collect)) {
    seenBtn.classList.add("is-active");
  }
  seenBtn.addEventListener("click", () => {
    if (interest.collect) {
      interest.collect.click();
    }
  });
  actions.append(seenBtn);

  info.append(actions);

  if (data.summary) {
    const teaser = el("p", {
      className: "atv-hero-teaser is-clamped",
      text: data.summary,
    });
    info.append(teaser);
    const more = el("button", {
      attrs: { type: "button" },
      className: "atv-hero-more",
    });
    const moreLabel = el("span", { text: "展开" });
    more.append(moreLabel);
    more.append(el("span", { html: ICON_CHEVRON }));
    more.addEventListener("click", () => {
      const open = !teaser.classList.toggle("is-clamped");
      more.classList.toggle("is-open", open);
      moreLabel.textContent = open ? "收起" : "展开";
    });
    requestAnimationFrame(() => {
      const overflowing = teaser.scrollHeight - teaser.clientHeight > 4;
      if (!overflowing) {
        more.style.display = "none";
      }
    });
    info.append(more);
  }

  inner.append(info);
  hero.append(inner);
  return hero;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildHero, buildHeroBg, pickStill };
