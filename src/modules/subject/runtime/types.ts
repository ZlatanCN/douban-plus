import type {
  InterestMarkingActions,
  NavSection,
  Comment,
  Photo,
  ReviewVoteCallback,
  SeriesItem,
} from "@/modules/subject/domain";
import type { RatingResultMap } from "@/modules/subject/resolve/types";

type CommentVoteCallback = (
  cid: string
) => Promise<{ ok: boolean; count?: number }>;

type SubjectPageNavigation = {
  activeSectionId: string;
  navRef: { current: HTMLElement | null };
  onJump: (sectionId: string) => void;
  scrolling: boolean;
  sections: NavSection[];
  visible: boolean;
};

type ResolvedPhoto = Photo & {
  aspectRatio: number;
};

type PhotoResolution = {
  photos: ResolvedPhoto[];
  status: "loading" | "ready";
};

type ResolvedSeriesItem = SeriesItem & {
  isCurrent: boolean;
};

type SubjectPageRuntime = {
  actions: {
    interestMarking: InterestMarkingActions;
    handleCommentVote: CommentVoteCallback;
    handleReviewVote: ReviewVoteCallback;
  };
  externalRatings: RatingResultMap | null;
  firstBroadcastPlatform: string | null;
  navigation: SubjectPageNavigation;
  photoResolution: PhotoResolution;
  resolvedComments: Comment[];
  series: ResolvedSeriesItem[];
  seriesMoreLink?: { href: string; text: string };
  summary: string | null;
};

export type {
  CommentVoteCallback,
  PhotoResolution,
  ResolvedPhoto,
  ResolvedSeriesItem,
  SubjectPageNavigation,
  SubjectPageRuntime,
};
