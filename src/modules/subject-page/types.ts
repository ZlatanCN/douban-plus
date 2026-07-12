import type { AccountActionGuard, ReviewVoteCallback } from "@/types";

type CommentVoteCallback = (
  cid: string
) => Promise<{ ok: boolean; count?: number }>;

type SubjectPageDeps = {
  doc?: Document;
  canReviewVote?: AccountActionGuard;
  canVote?: AccountActionGuard;
  handleReviewVote?: ReviewVoteCallback;
  handleVote: CommentVoteCallback;
  seriesMoreLink?: { href: string; text: string };
};

export type { CommentVoteCallback, SubjectPageDeps };
