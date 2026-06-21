import "./styles.css";
import { postVote } from "./api/comment";
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
import { el } from "./components";
import {
  extractAwards,
  extractCelebrities,
  extractComments,
  extractInfo,
  extractInterestState,
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
import type { DoubanData } from "./types";

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
    const info = extractInfo();
    const isTV = !!(
      info.episodes ||
      info.seasons ||
      info.episodeRuntime ||
      info.firstAired
    );
    data = {
      awards: extractAwards(),
      celebrities: extractCelebrities(),
      comments: extractComments(),
      info,
      interest: extractInterestState(),
      isTV,
      photos: extractPhotos(),
      poster: extractPoster(),
      rating: extractRating(),
      recommendations: extractRecommendations(),
      streaming: extractStreaming(),
      subjectId: extractSubjectId(),
      summary: extractSummary(),
      title: extractTitle(),
      year: extractYear(),
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

  const stickyNav = buildStickyNav(data);

  /* ── Append sections in order ───────────────────────── */

  root.append(buildHero(data));

  const streaming = buildStreaming(data.streaming);
  if (streaming) {
    root.append(streaming);
  }

  const cast = buildCast(data);
  if (cast) {
    root.append(cast);
  }

  const photos = buildPhotos(data);
  if (photos) {
    root.append(photos);
  }

  const comments = buildComments(data, (cid) => postVote(cid, data.subjectId));
  if (comments) {
    root.append(comments);
  }

  const recs = buildRecs(data.recommendations);
  if (recs) {
    root.append(recs);
  }

  const details = buildDetails(data);
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
};

/* ── Startup ─────────────────────────────────────────── */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", render, { once: true });
} else {
  render();
}
