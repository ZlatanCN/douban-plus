type SubjectSectionKey =
  | "streaming"
  | "series"
  | "cast"
  | "media"
  | "comments"
  | "discussions"
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
  comments: { navLabel: "短评", sectionTitle: "短评" },
  details: { navLabel: "详情", sectionTitle: "详情" },
  discussions: { navLabel: "讨论", sectionTitle: "讨论" },
  media: { navLabel: "影像", sectionTitle: "影像" },
  movieReviews: { navLabel: "影评", sectionTitle: "影评" },
  recommendations: { navLabel: "推荐", sectionTitle: "推荐" },
  series: { navLabel: "系列", sectionTitle: "系列" },
  streaming: { navLabel: "片源", sectionTitle: "片源" },
  tvReviews: { navLabel: "剧评", sectionTitle: "剧评" },
};

const getSubjectSectionCopy = (
  section: SubjectSectionKey
): SubjectSectionCopy => SECTION_COPY[section];

export { getSubjectSectionCopy };
export type { SubjectSectionCopy, SubjectSectionKey };
