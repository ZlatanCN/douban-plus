/* ── CSS Injection ────────────────────────────────────── */

import "./styles.css";

/* ── Extract Imports ─────────────────────────────────── */

import {
  extractAwards,
  extractCelebrities,
  extractComments,
  extractInfo,
  extractPhotos,
  extractPoster,
  extractRating,
  extractRecommendations,
  extractStreaming,
  extractSubjectId,
  extractSummary,
  extractTitle,
  extractYear,
} from "./extract";

/* ── Build Imports ───────────────────────────────────── */

import {
  buildCast,
  buildComments,
  buildDetails,
  buildHero,
  buildPhotos,
  buildRecs,
  buildStickyNav,
  buildStreaming,
} from "./build";

/* ── Component Imports ───────────────────────────────── */

import { el } from "./components/dom-factory";

/* ── Type Imports ────────────────────────────────────── */

import type { DoubanData } from "./types";

/* ── Render ──────────────────────────────────────────── */

function render(): void {
  if (document.getElementById("atv-douban-root")) {
    return;
  }

  if (!document.querySelector("#content h1")) {
    console.warn("[ATV-Douban] 未找到内容区域，跳过渲染");
    return;
  }

  let data: DoubanData;
  try {
    const info = extractInfo();
    const isTV = !!(
      info.episodes ||
      info.seasons ||
      info.episodeRuntime ||
      info.firstAired
    );
    data = {
      subjectId: extractSubjectId(),
      title: extractTitle(),
      year: extractYear(),
      poster: extractPoster(),
      rating: extractRating(),
      summary: extractSummary(),
      info,
      celebrities: extractCelebrities(),
      photos: extractPhotos(),
      recommendations: extractRecommendations(),
      comments: extractComments(),
      awards: extractAwards(),
      streaming: extractStreaming(),
      isTV,
    };
  } catch (err) {
    console.warn("[ATV-Douban] 数据提取失败：", err);
    return;
  }

  const root = el("div", { id: "atv-douban-root" });

  document.title =
    (data.title.primary || data.title.full) +
    (data.year ? ` (${data.year})` : "") +
    " · 豆瓣";

  const stickyNav = buildStickyNav(data);

  /* ── Append sections in order ───────────────────────── */

  root.appendChild(buildHero(data));

  const streaming = buildStreaming(data);
  if (streaming) {
    root.appendChild(streaming);
  }

  const cast = buildCast(data);
  if (cast) {
    root.appendChild(cast);
  }

  const photos = buildPhotos(data);
  if (photos) {
    root.appendChild(photos);
  }

  const comments = buildComments(data);
  if (comments) {
    root.appendChild(comments);
  }

  const recs = buildRecs(data);
  if (recs) {
    root.appendChild(recs);
  }

  const details = buildDetails(data);
  if (details) {
    root.appendChild(details);
  }

  root.appendChild(el("div", { className: "atv-footer-spacer" }));

  /* ── DOM insertion ──────────────────────────────────── */

  document.body.insertBefore(root, document.body.firstChild);
  document.body.appendChild(stickyNav);

  /* ── Scroll listener for sticky nav ─────────────────── */

  const reveal = (): void => {
    const y = window.scrollY || window.pageYOffset || 0;
    stickyNav.classList.toggle("is-visible", y > 300);
  };
  window.addEventListener("scroll", reveal, { passive: true });
  reveal();
}

/* ── Startup ─────────────────────────────────────────── */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render, { once: true });
} else {
  render();
}
