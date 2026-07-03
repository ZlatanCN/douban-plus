import "./styles.css";
import { resolveCommentAvatars } from "./api/avatar";
import { postVote } from "./api/comment";
import { fetchImdbRating } from "./api/imdb";
import { postInterest, removeInterest } from "./api/interest";
import {
  buildCast,
  buildComments,
  buildDetails,
  buildHero,
  buildImdbRating,
  buildPhotos,
  buildRecs,
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

/* ── Compute which nav sections have content ──────────── */

const computeNavSections = (data: DoubanData): NavSection[] => {
  const sections: NavSection[] = [];
  if (data.streaming.length > 0) {
    sections.push({ id: "atv-stream", label: "在哪儿看" });
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

/* ── Async IMDb Rating Fetch ─────────────────────────── */

const resolveImdbRating = async (imdbId: string): Promise<void> => {
  const section = document.querySelector<HTMLElement>(".atv-rating-panel-imdb");
  if (!section) {
    console.warn("[IMDB] IMDb panel section not found in DOM");
    return;
  }

  const rating = await fetchImdbRating(imdbId);
  if (rating) {
    const loaded = buildImdbRating(rating);
    section.replaceWith(loaded);
  } else {
    section.classList.remove("is-loading");
    section.classList.add("is-empty");
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
    resolveImdbRating(imdbId);
  }
};

/* ── Exports (for testability) ───────────────────────── */

export { buildHeroCallbacks, computeNavSections };

/* ── Startup ─────────────────────────────────────────── */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render, { once: true });
} else {
  render();
}
