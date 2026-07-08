import { el } from "../../components";
import { buildSection } from "../../components/sections";
import type { ReviewData } from "../../types";
import { buildReviewCard } from "./card";

const buildReviews = (data: ReviewData): HTMLElement | null => {
  if (!data.reviews?.length) {
    return null;
  }

  const grid = el("div", { className: "atv-reviews" });
  for (const review of data.reviews) {
    grid.append(buildReviewCard(review, data.onReviewVote, data.canReviewVote));
  }

  const allHref = data.subjectId
    ? `https://movie.douban.com/subject/${data.subjectId}/reviews`
    : "";
  const sectionTitle = data.isTV ? "最热剧评" : "最热影评";
  return buildSection("atv-reviews", sectionTitle, grid, {
    moreLink: allHref ? { href: allHref, text: "查看全部 →" } : undefined,
  });
};

export { buildReviews };
