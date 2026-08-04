type SubjectCommentStatus = {
  active: boolean;
  count: number;
  href: string;
  label: string;
  value: string;
};

type SubjectCommentsBrowseOption = {
  active: boolean;
  href: string;
  label: string;
  requiresLogin?: boolean;
};

type SubjectCommentsScoreFilter = SubjectCommentsBrowseOption & {
  value: string;
};

type SubjectCommentAuthor = {
  avatar: string | null;
  href: string | null;
  name: string;
};

type SubjectCommentTime = {
  href: string | null;
  label: string;
};

type SubjectCommentVotes = {
  canVote: boolean;
  count: number;
  requiresLogin: boolean;
  voted: boolean;
};

type SubjectComment = {
  author: SubjectCommentAuthor;
  content: string;
  id: string;
  location: string | null;
  rating: number | null;
  status: string | null;
  time: SubjectCommentTime | null;
  votes: SubjectCommentVotes;
};

type SubjectCommentsPaginationLink = {
  active: boolean;
  href: string | null;
  label: string;
  relation: string | null;
};

type SubjectCommentsPageData = {
  comments: SubjectComment[];
  pagination: SubjectCommentsPaginationLink[];
  scoreFilters: SubjectCommentsScoreFilter[];
  sorts: SubjectCommentsBrowseOption[];
  statuses: SubjectCommentStatus[];
  subjectHref: string;
  subjectId: string;
  title: string;
  writeActionAvailable: boolean;
};

export type {
  SubjectComment,
  SubjectCommentAuthor,
  SubjectCommentStatus,
  SubjectCommentTime,
  SubjectCommentVotes,
  SubjectCommentsBrowseOption,
  SubjectCommentsPageData,
  SubjectCommentsPaginationLink,
  SubjectCommentsScoreFilter,
};
