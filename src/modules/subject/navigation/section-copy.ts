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

const SECTION_COPY: Record<SubjectSectionKey, string> = {
  cast: "演职员",
  comments: "短评",
  details: "详情",
  discussions: "讨论",
  media: "影像",
  movieReviews: "影评",
  recommendations: "推荐",
  series: "系列",
  streaming: "片源",
  tvReviews: "剧评",
};

const getSubjectSectionCopy = (section: SubjectSectionKey): string =>
  SECTION_COPY[section];

export { getSubjectSectionCopy };
export type { SubjectSectionKey };
