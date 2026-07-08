import type {
  AccountActionGuard,
  HeroCallbacks,
  ReviewVoteCallback,
} from "../../types";

type CommentVoteCallback = (
  cid: string
) => Promise<{ ok: boolean; count?: number }>;

interface SubjectPageDeps {
  canReviewVote?: AccountActionGuard;
  canVote?: AccountActionGuard;
  heroCallbacks: HeroCallbacks;
  handleReviewVote?: ReviewVoteCallback;
  handleVote: CommentVoteCallback;
  seriesMoreLink?: { href: string; text: string };
}

export type { CommentVoteCallback, SubjectPageDeps };
