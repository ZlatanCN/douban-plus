type SubjectSectionKey =
  | "streaming"
  | "series"
  | "cast"
  | "media"
  | "comments"
  | "movieReviews"
  | "tvReviews"
  | "recommendations"
  | "details";

type SubjectSectionCopy = {
  navLabel: string;
  sectionTitle: string;
};

const SECTION_COPY: Record<SubjectSectionKey, SubjectSectionCopy> = {
  cast: { navLabel: "演职员", sectionTitle: "演职员" },
  comments: { navLabel: "短评", sectionTitle: "热门短评" },
  details: { navLabel: "详情", sectionTitle: "详细信息" },
  media: { navLabel: "影像", sectionTitle: "影像" },
  movieReviews: { navLabel: "影评", sectionTitle: "热门影评" },
  recommendations: { navLabel: "相似作品", sectionTitle: "相似作品" },
  series: { navLabel: "同系列", sectionTitle: "同系列作品" },
  streaming: { navLabel: "观看平台", sectionTitle: "观看平台" },
  tvReviews: { navLabel: "剧评", sectionTitle: "热门剧评" },
};

const getSubjectSectionCopy = (
  section: SubjectSectionKey
): SubjectSectionCopy => SECTION_COPY[section];

export { getSubjectSectionCopy };
export type { SubjectSectionCopy, SubjectSectionKey };
