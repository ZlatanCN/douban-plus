import { el } from "../components";
import type {
  DoubanData,
  HeroCallbacks,
  NavSection,
  ReviewVoteCallback,
} from "../types";
import { buildCast } from "./cast";
import { buildComments } from "./comments";
import { buildDetails } from "./details";
import { buildHero } from "./hero";
import { buildPhotos } from "./photos";
import { buildRecs } from "./recommendations";
import { buildReviews } from "./reviews";
import { buildSeries } from "./series";
import { buildStickyNav } from "./sticky-nav";
import { buildStreaming } from "./streaming";

/* ── Types ──────────────────────────────────────────────── */

type BuildAppDeps = {
  heroCallbacks: HeroCallbacks;
  onVote: (cid: string) => Promise<{ ok: boolean; count?: number }>;
  onReviewVote?: ReviewVoteCallback;
  seriesMoreLink?: { href: string; text: string };
};

type BuildAppResult = {
  root: HTMLElement;
  stickyNav: HTMLElement;
};

/* ── computeNavSections — moved from main.ts ──────────── */

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
  if (data.reviews?.length > 0) {
    sections.push({ id: "atv-reviews", label: data.isTV ? "剧评" : "影评" });
  }
  if (data.recommendations.length > 0) {
    sections.push({ id: "atv-recs", label: "相似作品" });
  }
  sections.push({ id: "atv-info", label: "详情" });
  return sections;
};

/* ── buildApp — pure function ──────────────────────────── */

const buildApp = (data: DoubanData, deps: BuildAppDeps): BuildAppResult => {
  const root = el("div", { id: "atv-douban-root" });

  const sections = computeNavSections(data);

  const stickyNav = buildStickyNav({
    sections,
    title: { full: data.title.full, primary: data.title.primary },
  });

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
      deps.heroCallbacks
    )
  );

  const streaming = buildStreaming(data.streaming);
  if (streaming) {
    root.append(streaming);
  }

  const series = buildSeries(data.series, {
    moreLink: deps.seriesMoreLink,
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
    deps.onVote
  );
  if (comments) {
    root.append(comments);
  }

  const reviews = buildReviews({
    isTV: data.isTV,
    onReviewVote: deps.onReviewVote,
    reviews: data.reviews,
    subjectId: data.subjectId,
  });
  if (reviews) {
    root.append(reviews);
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

  return { root, stickyNav };
};

export { buildApp, computeNavSections };
export type { BuildAppDeps, BuildAppResult };
