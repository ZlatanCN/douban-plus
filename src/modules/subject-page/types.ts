import type { RatingResultMap } from "@/resolve/types";
import type {
  InterestFormState,
  InterestState,
  NavSection,
  ReviewVoteCallback,
  SeriesItem,
} from "@/types";

type CommentVoteCallback = (
  cid: string
) => Promise<{ ok: boolean; count?: number }>;

type InterestMarkingActions = {
  post: (
    subjectId: string,
    status: InterestFormState["status"],
    options?: { comment?: string; rating?: number }
  ) => Promise<{ error?: string; ok: boolean }>;
  reload: () => void;
  remove: (
    subjectId: string,
    status: InterestState["status"]
  ) => Promise<{ error?: string; ok: boolean }>;
};

type SubjectPageNavigation = {
  activeSectionId: string;
  onJump: (sectionId: string) => void;
  scrolling: boolean;
  sections: NavSection[];
  visible: boolean;
};

type SubjectPageRuntime = {
  actions: {
    expandNativeSummary: () => Promise<string | null>;
    interestMarking: InterestMarkingActions;
    handleCommentVote: CommentVoteCallback;
    handleReviewVote: ReviewVoteCallback;
  };
  avatarUrls: Map<string, string>;
  externalRatings: RatingResultMap | null;
  firstBroadcastPlatform: string | null;
  navigation: SubjectPageNavigation;
  series: SeriesItem[];
  seriesMoreLink?: { href: string; text: string };
};

export type {
  CommentVoteCallback,
  InterestMarkingActions,
  SubjectPageNavigation,
  SubjectPageRuntime,
};
