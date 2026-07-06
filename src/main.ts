import "./styles.css";
import { resolveCommentAvatars } from "./api/avatar";
import { postVote } from "./api/comment";
import { postInterest, removeInterest } from "./api/interest";
import { buildApp, buildSeries } from "./build";
import { el, openInterestModal } from "./components";
import {
  extractAwards,
  extractCelebrities,
  extractComments,
  extractInfo,
  extractInterestState,
  extractPhotos,
  extractPoster,
  extractSeries,
  extractTrailers,
  extractRating,
  extractRecommendations,
  extractStreaming,
  extractSubjectId,
  extractSummary,
  extractTitle,
  extractYear,
  findInterestButtons,
} from "./extract";
import { applyImdbResult, applyMcResult, applyRtResult } from "./resolve/apply";
import { buildContext } from "./resolve/context";
import { resolveAll } from "./resolve/orchestrate";
import type { DoubanData, HeroCallbacks } from "./types";

/** Extract the series more-link from the DOM header
 *  ("全部 N 部" link pointing to the full series page). */
const extractSeriesMoreLink = ():
  | { href: string; text: string }
  | undefined => {
  const linkEl = document.querySelector(
    "#series-items .items-swiper-title .pl a"
  );
  if (!linkEl) {
    return undefined;
  }
  return {
    href: (linkEl as HTMLAnchorElement).href,
    text: (linkEl.textContent || "").replaceAll(/[()（）]/gu, "").trim(),
  };
};

/** Watch #series-items for late-loading .items-swiper (Douban loads series
 *  data asynchronously via AJAX after the initial page render). When the
 *  swiper appears, build the series section and insert it into the root. */
const watchSeries = (root: HTMLElement, stickyNav: HTMLElement): void => {
  const container = document.querySelector("#series-items");
  if (!container) {
    return;
  }
  if (container.querySelector(".items-swiper")) {
    return;
  }
  if (root.querySelector("#atv-series")) {
    return;
  }

  const observer = new MutationObserver((): void => {
    if (!container.querySelector(".items-swiper")) {
      return;
    }
    observer.disconnect();

    const items = extractSeries(document);
    if (items.length === 0) {
      return;
    }

    const series = buildSeries(items, {
      moreLink: extractSeriesMoreLink(),
    });
    if (!series) {
      return;
    }

    /* Insert after streaming section, or after hero (first child) */
    const ref = root.querySelector("#atv-stream");
    if (ref) {
      ref.after(series);
    } else if (root.firstElementChild) {
      root.firstElementChild.after(series);
    }

    /* Update sticky nav — insert "同系列" after streaming link */
    const wrap = stickyNav.querySelector(".atv-stickynav-jumps");
    if (!wrap) {
      return;
    }
    if (wrap.querySelector('a[href="#atv-series"]')) {
      return;
    }

    const a = el("a", { href: "#atv-series", text: "同系列" });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelector("#atv-series")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const streamLink = wrap.querySelector('a[href="#atv-stream"]');
    if (streamLink) {
      streamLink.after(a);
    } else {
      wrap.prepend(a);
    }
  });

  observer.observe(container, { childList: true, subtree: true });
};

/* ── Resolve all ratings via the resolution seam ──── */

const resolveAllRatings = async (
  imdbId: string,
  isTV: boolean
): Promise<void> => {
  const ctx = buildContext(imdbId, isTV, document);
  const results = await resolveAll(ctx);
  applyImdbResult(results.imdb);
  applyRtResult(results.rt);
  applyMcResult(results.mc);
};

/* ── Wire hero callbacks (replaces direct api/extract imports in hero.ts) ── */

const buildHeroCallbacks = (subjectId: string): HeroCallbacks => {
  const interestBtns = findInterestButtons(document);
  return {
    onCollectClick: () => interestBtns.collect?.click(),
    onOpenInterest: (state) => {
      openInterestModal(state, {
        onRemove: async (status) => {
          const result = await removeInterest(subjectId, status);
          if (result.ok) {
            location.reload();
          }
          return result;
        },
        onSave: async (form) => {
          const result = await postInterest(subjectId, form.status, {
            comment: form.comment,
            rating: form.rating > 0 ? form.rating : undefined,
          });
          if (result.ok) {
            location.reload();
          }
          return result;
        },
      });
    },
    onWatchingClick: () => interestBtns.do?.click(),
    onWishClick: () => interestBtns.wish?.click(),
  };
};

// (resolved via resolveAllRatings above — no standalone trigger needed)

const render = (): void => {
  if (document.querySelector("#atv-douban-root")) {
    return;
  }

  if (!document.querySelector("#content h1")) {
    console.warn("[ATV-Douban] 未找到内容区域，跳过渲染");
    return;
  }

  let data: DoubanData;
  try {
    const info = extractInfo(document);
    const isTV = !!(
      info.episodes ||
      info.seasons ||
      info.episodeRuntime ||
      info.firstAired
    );
    data = {
      awards: extractAwards(document),
      celebrities: extractCelebrities(document),
      comments: extractComments(document),
      info,
      interest: extractInterestState(document),
      isTV,
      photos: extractPhotos(document),
      poster: extractPoster(document),
      rating: extractRating(document),
      recommendations: extractRecommendations(document),
      series: extractSeries(document),
      streaming: extractStreaming(document),
      subjectId: extractSubjectId(document),
      summary: extractSummary(document),
      title: extractTitle(document),
      trailers: extractTrailers(document),
      year: extractYear(document),
    };
  } catch (error) {
    console.warn("[ATV-Douban] 数据提取失败：", error);
    return;
  }

  document.title = `${
    (data.title.primary || data.title.full) +
    (data.year ? ` (${data.year})` : "")
  } · 豆瓣`;

  const { root, stickyNav } = buildApp(data, {
    heroCallbacks: buildHeroCallbacks(data.subjectId),
    onVote: (cid) => postVote(cid, data.subjectId),
    seriesMoreLink: extractSeriesMoreLink(),
  });

  if (data.comments.length > 0) {
    resolveCommentAvatars(data.comments);
  }

  /* ── DOM insertion ──────────────────────────────────── */

  document.body.insertBefore(root, document.body.firstChild);
  document.body.append(stickyNav);

  /* ── Scroll listener for sticky nav ─────────────────── */

  const reveal = (): void => {
    const y = window.scrollY || window.pageYOffset || 0;
    stickyNav.classList.toggle("is-visible", y > 300);
  };
  window.addEventListener("scroll", reveal, { passive: true });
  reveal();

  /* ── Async IMDb fetch after render ────────────────── */

  const imdbId = data.info.imdb || null;
  if (imdbId) {
    void resolveAllRatings(imdbId, data.isTV);
  }

  /* ── Watch for deferred series data ──────────────── */

  watchSeries(root, stickyNav);
};

/* ── Exports (for testability) ───────────────────────── */

export { buildHeroCallbacks, watchSeries };

/* ── Startup ─────────────────────────────────────────── */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render, { once: true });
} else {
  render();
}
