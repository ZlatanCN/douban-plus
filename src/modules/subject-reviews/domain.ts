type SubjectReviewAuthor = {
  avatar: string | null;
  href: string | null;
  name: string;
};

type SubjectReviewReply = {
  href: string;
  label: string;
};

type SubjectReview = {
  author: SubjectReviewAuthor;
  content: string;
  id: string;
  ratingWord: string;
  reply: SubjectReviewReply | null;
  spoiler: boolean;
  stars: number;
  time: string;
  title: string;
  usefulCount: number;
  uselessCount: number;
};

type SubjectReviewsBrowseOption = {
  active: boolean;
  href: string;
  label: string;
  value: string;
};

type SubjectReviewsPaginationLink = {
  active: boolean;
  href: string | null;
  label: string;
};

type SubjectReviewsPageData = {
  pagination: SubjectReviewsPaginationLink[];
  ratings: SubjectReviewsBrowseOption[];
  reviewKind: "影评" | "剧评";
  reviews: SubjectReview[];
  sorts: SubjectReviewsBrowseOption[];
  subjectHref: string;
  subjectId: string;
  title: string;
  writeHref: string;
};

export type {
  SubjectReview,
  SubjectReviewAuthor,
  SubjectReviewReply,
  SubjectReviewsBrowseOption,
  SubjectReviewsPageData,
  SubjectReviewsPaginationLink,
};
