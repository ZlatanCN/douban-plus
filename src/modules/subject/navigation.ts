import type { DoubanData, NavSection } from "@/types";

import { getSubjectSectionCopy } from "./section-copy";

const computeNavSections = (data: DoubanData): NavSection[] => {
  const sections: NavSection[] = [];

  if (data.streaming.length > 0) {
    sections.push({
      id: "atv-stream",
      label: getSubjectSectionCopy("streaming").navLabel,
    });
  }
  if (data.series.length > 0) {
    sections.push({
      id: "atv-series",
      label: getSubjectSectionCopy("series").navLabel,
    });
  }
  if (data.celebrities.length > 0) {
    sections.push({
      id: "atv-cast",
      label: getSubjectSectionCopy("cast").navLabel,
    });
  }
  if (data.photos.length > 0 || data.trailers.length > 0) {
    sections.push({
      id: "atv-photos",
      label: getSubjectSectionCopy("media").navLabel,
    });
  }
  if (data.comments.length > 0) {
    sections.push({
      id: "atv-comments",
      label: getSubjectSectionCopy("comments").navLabel,
    });
  }
  if (data.reviews.length > 0) {
    sections.push({
      id: "atv-reviews",
      label: getSubjectSectionCopy(data.isTV ? "tvReviews" : "movieReviews")
        .navLabel,
    });
  }
  if (data.discussions.topics.length > 0) {
    sections.push({
      id: "atv-discussions",
      label: getSubjectSectionCopy("discussions").navLabel,
    });
  }
  if (data.recommendations.length > 0) {
    sections.push({
      id: "atv-recs",
      label: getSubjectSectionCopy("recommendations").navLabel,
    });
  }

  sections.push({
    id: "atv-info",
    label: getSubjectSectionCopy("details").navLabel,
  });
  return sections;
};

export { computeNavSections };
