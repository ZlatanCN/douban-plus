import type { Review, ReviewVoteCallback } from "../../../types";
import { createCache } from "../../../utils/cache";
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

const reviewVoteCache = createCache<StoredReviewVote | ReviewVoteDirection>(
  "atv:review:vote",
  365 * 24 * 60 * 60 * 1000
);

const reviewVoteKey = (review: Review): string => reviewNumericId(review.id);

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

const initialReviewVoteState = (review: Review): ReviewVoteState => {
  const cached = reviewVoteCache.get(reviewVoteKey(review));
  return {
    usefulCount:
      typeof cached === "object" && typeof cached.usefulCount === "number"
        ? cached.usefulCount
        : (review.usefulCount ?? 0),
    uselessCount:
      typeof cached === "object" && typeof cached.uselessCount === "number"
        ? cached.uselessCount
        : (review.uselessCount ?? 0),
    voted: voteDirection(cached),
  };
};

const optimisticReviewVoteState = (
  state: ReviewVoteState,
  type: ReviewVoteDirection
): ReviewVoteState => ({
  usefulCount: state.usefulCount + (type === "useful" ? 1 : 0),
  uselessCount: state.uselessCount + (type === "useless" ? 1 : 0),
  voted: type,
});

const resolvedReviewVoteState = (
  current: ReviewVoteState,
  type: ReviewVoteDirection,
  result: ReviewVoteResult
): ReviewVoteState => ({
  usefulCount: result.usefulCount ?? current.usefulCount,
  uselessCount: result.uselessCount ?? current.uselessCount,
  voted: type,
});

const persistReviewVoteState = (
  review: Review,
  state: ReviewVoteState
): void => {
  if (!state.voted) {
    return;
  }
  reviewVoteCache.set(reviewVoteKey(review), {
    type: state.voted,
    usefulCount: state.usefulCount,
    uselessCount: state.uselessCount,
  });
};

const reviewWithVoteState = (
  review: Review,
  state: ReviewVoteState
): Review => ({
  ...review,
  usefulCount: state.usefulCount,
  uselessCount: state.uselessCount,
});

export {
  initialReviewVoteState,
  optimisticReviewVoteState,
  persistReviewVoteState,
  resolvedReviewVoteState,
  reviewVoteKey,
  reviewWithVoteState,
};
export type { ReviewVoteDirection, ReviewVoteState };
