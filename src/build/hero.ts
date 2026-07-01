import { el, renderStars, openPosterModal } from "../components";
import {
  ICON_CHECK,
  ICON_CHEVRON,
  ICON_FILM_PLACEHOLDER,
  ICON_PLAY,
  ICON_STAR_EMPTY,
  ICON_STAR_FULL,
  ICON_THUMB,
  RE_SEASON_SUFFIX,
} from "../constants";
import type { HeroData, HeroCallbacks, InterestState, Photo } from "../types";
import { INTEREST_LABELS } from "../types";
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
const buildHeroBg = (data: HeroData): HTMLElement => {
  const bg = el("div", { className: "atv-hero-bg" });
  const still = pickStill(data.photos, data.subjectId);

  if (still?.hdUrl) {
    const thumb = el("div", { className: "atv-hero-still is-thumb" });
    thumb.style.backgroundImage = `url("${still.thumbUrl || still.hdUrl}")`;
    bg.append(thumb);

    const hd = el("div", { className: "atv-hero-still is-hd" });
    hd.setAttribute("aria-hidden", "true");
    bg.append(hd);

    const loader = new Image();
    loader.addEventListener(
      "load",
      () => {
        hd.style.backgroundImage = `url("${still.hdUrl}")`;
        requestAnimationFrame(() => hd.classList.add("is-loaded"));
      },
      { once: true }
    );
    loader.addEventListener(
      "error",
      (e) => {
        console.error("[Hero] HD still FAILED:", still.hdUrl, e);
        if (still.thumbUrl && still.thumbUrl !== still.hdUrl) {
          hd.style.backgroundImage = `url("${still.thumbUrl}")`;
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
    poster.style.backgroundImage = `url("${data.poster}")`;
    bg.append(poster);
    return bg;
  }

  bg.style.background =
    "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)";
  return bg;
};

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

const buildMeta = (data: HeroData): HTMLElement => {
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

const buildRatingRow = (data: HeroData): HTMLElement => {
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

/** Build a single interest action button */
const makeInterestBtn = (
  text: string,
  cls: string,
  onClick: () => void
): HTMLButtonElement => {
  const icon = text === "想看" ? ICON_PLAY : ICON_CHECK;
  const btn = el("button", { attrs: { type: "button" }, className: cls }, [
    el("span", { html: icon }),
    el("span", { text }),
  ]);
  btn.addEventListener("click", onClick);
  return btn;
};

/** Add a "在看" button before "看过" when hasWatching (TV series) */
const addWatchingBtn = (actions: HTMLElement, onClick: () => void): void => {
  const btn = makeInterestBtn("在看", "atv-btn atv-btn-secondary", onClick);
  const seenBtn = actions.lastElementChild;
  if (seenBtn) {
    seenBtn.before(btn);
  } else {
    actions.append(btn);
  }
};

const buildActions = (
  state: InterestState,
  callbacks: HeroCallbacks
): HTMLElement => {
  const actions = el("div", { className: "atv-actions" });

  if (!state.loggedIn) {
    actions.append(
      makeInterestBtn("想看", "atv-btn atv-btn-primary", callbacks.onWishClick)
    );
    actions.append(
      makeInterestBtn(
        "看过",
        "atv-btn atv-btn-secondary",
        callbacks.onCollectClick
      )
    );
    if (state.hasWatching) {
      addWatchingBtn(actions, callbacks.onWatchingClick);
    }
    return actions;
  }

  if (!state.marked) {
    actions.append(
      makeInterestBtn("想看", "atv-btn atv-btn-primary", () =>
        callbacks.onOpenInterest(state)
      )
    );
    actions.append(
      makeInterestBtn("看过", "atv-btn atv-btn-secondary", () =>
        callbacks.onOpenInterest(state)
      )
    );
    if (state.hasWatching) {
      addWatchingBtn(actions, () => callbacks.onOpenInterest(state));
    }
    return actions;
  }

  const label = INTEREST_LABELS[state.status];

  const header = el("div", { className: "atv-interest-panel-header" });
  header.append(
    el(
      "button",
      {
        attrs: { type: "button" },
        className: [
          "atv-btn",
          "atv-btn-primary",
          "is-active",
          "atv-interest-badge",
        ],
        onclick: () => callbacks.onOpenInterest(state),
      },
      [el("span", { html: ICON_CHECK }), el("span", { text: label })]
    )
  );
  if (state.rating > 0) {
    const starHtml = Array.from({ length: 5 }, (_, i) =>
      i < state.rating ? ICON_STAR_FULL : ICON_STAR_EMPTY
    ).join("");
    header.append(
      el("span", { className: "atv-interest-panel-stars", html: starHtml })
    );
  }
  if (state.date) {
    header.append(
      el("span", { className: "atv-interest-panel-date", text: state.date })
    );
  }

  const panel = el("div", { className: "atv-interest-panel" }, [header]);

  if (state.comment) {
    const commentChildren: (HTMLElement | string)[] = [
      el("span", { text: `"${state.comment}"` }),
    ];
    if (state.usefulCount) {
      const num = state.usefulCount.replaceAll(/\D/gu, "");
      commentChildren.push(
        el("span", { className: "atv-useful-badge" }, [
          el("span", { html: ICON_THUMB }),
          el("span", { text: num }),
        ])
      );
    }
    panel.append(
      el("div", { className: "atv-interest-panel-comment" }, commentChildren)
    );
  }

  actions.append(panel);
  return actions;
};

/**
 * Build the entire hero banner section — poster card, title, meta chips,
 * rating row, wish/seen buttons, summary teaser, and background.
 */
const buildHero = (data: HeroData, callbacks: HeroCallbacks): HTMLElement => {
  const hero = el("section", { className: "atv-hero" });

  hero.append(buildHeroBg(data));
  hero.append(el("div", { className: "atv-hero-vignette" }));
  hero.append(el("div", { className: "atv-hero-overlay-x" }));
  hero.append(el("div", { className: "atv-hero-overlay-y" }));

  const innerSection = el("div", { className: "atv-hero-inner-section" });
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

  const actions = buildActions(data.interest, callbacks);
  info.append(actions);

  if (data.summary) {
    const summary = el("div", { className: "atv-hero-summary" });

    const teaser = el("p", {
      className: "atv-hero-teaser is-clamped",
      text: data.summary,
    });
    summary.append(teaser);

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
    summary.append(more);
    info.append(summary);
  }

  inner.append(info);
  innerSection.append(inner);
  hero.append(innerSection);

  return hero;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildHero, buildHeroBg, pickStill };
