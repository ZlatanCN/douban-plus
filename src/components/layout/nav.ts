import type { DoubanData, NavSection } from "@/types";

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
  if (data.reviews.length > 0) {
    sections.push({ id: "atv-reviews", label: data.isTV ? "剧评" : "影评" });
  }
  if (data.recommendations.length > 0) {
    sections.push({ id: "atv-recs", label: "相似作品" });
  }

  sections.push({ id: "atv-info", label: "详情" });
  return sections;
};

export { computeNavSections };
