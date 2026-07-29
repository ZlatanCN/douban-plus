import { createCache } from "@/shared/utils/cache";
import { createVoteState } from "@/shared/voting/vote-state";

import type { Review, ReviewVoteCallback } from "./domain";
import { reviewNumericId } from "./review-identity";

type ReviewVoteDirection = "useful" | "useless";
type ReviewVoteState = {
  usefulCount: number;
  uselessCount: number;
  voted: ReviewVoteDirection | null;
};
type StoredReviewVote = {
  type: ReviewVoteDirection | "up" | "down";
  usefulCount?: number;
  uselessCount?: number;
};
type ReviewVoteResult = Awaited<ReturnType<ReviewVoteCallback>>;

const reviewVoteCache = createCache<StoredReviewVote>(
  "atv:review:vote",
  365 * 24 * 60 * 60 * 1000
);
const voteDirection = (
  value: StoredReviewVote | ReviewVoteDirection | undefined
): ReviewVoteDirection | null => {
  const type = typeof value === "string" ? value : value?.type;
  if (type === "useful" || type === "up") {
    return "useful";
  }
  if (type === "useless" || type === "down") {
    return "useless";
  }
  return null;
};
const baseInitial = (review: Review): ReviewVoteState => ({
  usefulCount: review.usefulCount ?? 0,
  uselessCount: review.uselessCount ?? 0,
  voted: null,
});

const reviewVoteApi = createVoteState<
  ReviewVoteState,
  ReviewVoteDirection,
  Review,
  ReviewVoteResult,
  StoredReviewVote
>({
  countKey: (direction) =>
    direction === "useful" ? "usefulCount" : "uselessCount",
  initial: baseInitial,
  key: (review) => reviewNumericId(review.id),
  mergeResult: (state, direction, result) => ({
    ...state,
    usefulCount: result.usefulCount ?? state.usefulCount,
    uselessCount: result.uselessCount ?? state.uselessCount,
    voted: direction,
  }),
  persistence: {
    cache: reviewVoteCache,
    hydrate: (stored) => ({
      voted: voteDirection(stored),
      ...(typeof stored.usefulCount === "number"
        ? { usefulCount: stored.usefulCount }
        : {}),
      ...(typeof stored.uselessCount === "number"
        ? { uselessCount: stored.uselessCount }
        : {}),
    }),
    serialize: (state) => ({
      type: state.voted ?? "useful",
      usefulCount: state.usefulCount,
      uselessCount: state.uselessCount,
    }),
  },
  toItem: (review, state) => ({
    ...review,
    usefulCount: state.usefulCount,
    uselessCount: state.uselessCount,
  }),
  votedOf: (state) => state.voted,
  withVoted: (state, direction) => ({ ...state, voted: direction }),
});

export { reviewVoteApi };
export type { ReviewVoteDirection, ReviewVoteState };
