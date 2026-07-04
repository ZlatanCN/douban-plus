import "./styles.css";
import { resolveCommentAvatars } from "./api/avatar";
import { postVote } from "./api/comment";
import { fetchImdbRating } from "./api/imdb";
import { postInterest, removeInterest } from "./api/interest";
import { fetchRtRating } from "./api/rotten";
import {
  buildCast,
  buildComments,
  buildDetails,
  buildHero,
  buildImdbRating,
  buildPhotos,
  buildRecs,
  buildRtRating,
  buildSeries,
  buildStickyNav,
  buildStreaming,
} from "./build";
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
import type { DoubanData, HeroCallbacks, NavSection } from "./types";

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

/* ── Compute which nav sections have content ──────────── */

const computeNavSections = (data: DoubanData): NavSection[] => {
  const sections: NavSection[] = [];
  if (data.streaming.length > 0) {
    sections.push({ id: "atv-stream", label: "在哪儿看" });
  }
  if (data.series.length > 0) {
    sections.push({ id: "atv-series", label: "同系列" });
  }
  if (data.celebrities.length > 0) {
    sections.push({ id: "atv-cast", label: "演职员" });
  }
  if (data.photos.length > 0 || data.trailers.length > 0) {
    sections.push({ id: "atv-photos", label: "剧照" });
  }
  if (data.comments.length > 0) {
    sections.push({ id: "atv-comments", label: "短评" });
  }
  if (data.recommendations.length > 0) {
    sections.push({ id: "atv-recs", label: "相似作品" });
  }
  sections.push({ id: "atv-info", label: "详情" });
  return sections;
};

/* ── Async IMDb / RT Rating Fetch ────────────────── */

/** Strip season/variant info from a Douban h1 like
 *  "权力的游戏 第五季 Game of Thrones Season 5 (2015)"
 *  to extract just the English series name ("Game of Thrones"). */
const extractEnglishSeriesName = (h1: string): string => {
  const cleaned = h1.replace(/\s*\(\d{4}\)\s*$/u, "").trim();
  const m = cleaned.match(/[A-Za-z][\w\s'\-!&.,]*/u);
  if (!m) {
    return "";
  }
  return m[0].replace(/\s*(?<seasonLabel>Season|S|Vol)\s*\d+/iu, "").trim();
};

const extractSeasonFromH1 = (h1: string): number | undefined => {
  const cn = "一二三四五六七八九十";
  const m = h1.match(/(?:Season|第)\s*(?<digit>\d+|[一二三四五六七八九十])/iu);
  if (!m?.groups?.digit) {
    return undefined;
  }
  const d = m.groups.digit;

  return /^\d+$/u.test(d) ? Number.parseInt(d, 10) : cn.indexOf(d) + 1;
};

const resolveRtRating = async (
  title: string,
  isTV?: boolean,
  season?: number,
  year?: string
): Promise<void> => {
  const section = document.querySelector<HTMLElement>(".atv-rating-panel-rt");
  if (!section) {
    console.warn("[RT] RT panel section not found in DOM");
    return;
  }
  const rating = await fetchRtRating(title, isTV, season, year);
  if (rating) {
    const loaded = buildRtRating(rating);
    section.replaceWith(loaded);
  } else {
    section.classList.remove("is-loading");
    section.classList.add("is-empty");
  }
};

const resolveImdbRating = async (
  imdbId: string,
  isTV: boolean,
  season?: number
): Promise<void> => {
  const section = document.querySelector<HTMLElement>(".atv-rating-panel-imdb");
  if (!section) {
    console.warn("[IMDB] IMDb panel section not found in DOM");
    return;
  }

  const result = await fetchImdbRating(imdbId, season);
  if (result.rating) {
    const loaded = buildImdbRating(result.rating);
    section.replaceWith(loaded);
  } else {
    section.classList.remove("is-loading");
    section.classList.add("is-empty");
  }

  // For RT lookup: extract English series name from Douban H1,
  // fallback to the IMDb title for non-TV content.
  const doubanH1 =
    document.querySelector("#content h1")?.textContent?.trim() || "";
  const rtTitle = extractEnglishSeriesName(doubanH1) || result.title || "";
  const rtSeason = extractSeasonFromH1(doubanH1) ?? season;
  // Extract year from trailing "(YYYY)" in Douban H1 for movie URL disambiguation
  const yearMatch = doubanH1.match(/\((?<year>\d{4})\)\s*$/u);
  const rtYear = isTV ? undefined : (yearMatch?.groups?.year ?? undefined);
  if (rtTitle) {
    resolveRtRating(rtTitle, isTV, rtSeason, rtYear);
  }
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

const triggerImdbFetch = (imdbId: string, isTV: boolean): void => {
  const seasonEl = document.querySelector<HTMLSelectElement>("#season");
  const seasonNumber = seasonEl
    ? (() => {
        const opt = seasonEl.options[seasonEl.selectedIndex];
        if (!opt) {
          return;
        }
        const m = (opt.textContent || "").trim().match(/(?<season>\d+)/u);
        return m?.groups ? Number.parseInt(m.groups.season, 10) : undefined;
      })()
    : undefined;
  const h1Text = document.querySelector("#content h1")?.textContent ?? "";
  const effectiveSeason =
    seasonNumber ?? (h1Text ? extractSeasonFromH1(h1Text) : undefined);
  resolveImdbRating(imdbId, isTV, effectiveSeason);
};

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

  const root = el("div", { id: "atv-douban-root" });

  document.title = `${
    (data.title.primary || data.title.full) +
    (data.year ? ` (${data.year})` : "")
  } · 豆瓣`;

  const sections = computeNavSections(data);

  const stickyNav = buildStickyNav({
    sections,
    title: { full: data.title.full, primary: data.title.primary },
  });

  const heroCallbacks = buildHeroCallbacks(data.subjectId);

  /* ── Append sections in order ───────────────────────── */

  root.append(
    buildHero(
      {
        imdbId: data.info.imdb || null,
        info: data.info,
        interest: data.interest,
        isTV: data.isTV,
        photos: data.photos,
        poster: data.poster,
        rating: data.rating,
        subjectId: data.subjectId,
        summary: data.summary,
        title: data.title,
        year: data.year,
      },
      heroCallbacks
    )
  );

  const streaming = buildStreaming(data.streaming);
  if (streaming) {
    root.append(streaming);
  }

  const series = buildSeries(data.series, {
    moreLink: extractSeriesMoreLink(),
  });
  if (series) {
    root.append(series);
  }

  const cast = buildCast(data.celebrities);
  if (cast) {
    root.append(cast);
  }

  const photos = buildPhotos({
    photos: data.photos,
    subjectId: data.subjectId,
    trailers: data.trailers,
  });
  if (photos) {
    root.append(photos);
  }

  const comments = buildComments(
    { comments: data.comments, subjectId: data.subjectId },
    (cid) => postVote(cid, data.subjectId)
  );
  if (comments) {
    root.append(comments);
    resolveCommentAvatars(data.comments);
  }

  const recs = buildRecs(data.recommendations);
  if (recs) {
    root.append(recs);
  }

  const details = buildDetails({
    awards: data.awards,
    info: data.info,
    isTV: data.isTV,
  });
  if (details) {
    root.append(details);
  }

  root.append(el("div", { className: "atv-footer-spacer" }));

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
    triggerImdbFetch(imdbId, data.isTV);
  }

  /* ── Watch for deferred series data ──────────────── */

  watchSeries(root, stickyNav);
};

/* ── Exports (for testability) ───────────────────────── */

export { buildHeroCallbacks, computeNavSections, watchSeries };

/* ── Startup ─────────────────────────────────────────── */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render, { once: true });
} else {
  render();
}
