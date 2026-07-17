import type { RatingResultMap } from "@/resolve/types";
import type {
  InterestMarkingActions,
  NavSection,
  Comment,
  ReviewVoteCallback,
  SeriesItem,
} from "@/types";

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

type SubjectPageRuntime = {
  actions: {
    interestMarking: InterestMarkingActions;
    handleCommentVote: CommentVoteCallback;
    handleReviewVote: ReviewVoteCallback;
  };
  externalRatings: RatingResultMap | null;
  firstBroadcastPlatform: string | null;
  navigation: SubjectPageNavigation;
  resolvedComments: Comment[];
  series: SeriesItem[];
  seriesMoreLink?: { href: string; text: string };
  summary: string | null;
};

export type { CommentVoteCallback, SubjectPageNavigation, SubjectPageRuntime };
