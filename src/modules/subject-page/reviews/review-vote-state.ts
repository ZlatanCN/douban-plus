import type { Review, ReviewVoteCallback } from "@/types";
import { createCache } from "@/utils/cache";

import { createVoteState } from "../vote-state";
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

const baseInitialReviewVoteState = (review: Review): ReviewVoteState => ({
  usefulCount: review.usefulCount ?? 0,
  uselessCount: review.uselessCount ?? 0,
  voted: null,
});

const reviewWithVoteState = (
  review: Review,
  state: ReviewVoteState
): Review => ({
  ...review,
  usefulCount: state.usefulCount,
  uselessCount: state.uselessCount,
});

const reviewVoteApi = createVoteState<
  ReviewVoteState,
  ReviewVoteDirection,
  Review,
  ReviewVoteResult,
  StoredReviewVote
>({
  countKey: (dir) => (dir === "useful" ? "usefulCount" : "uselessCount"),
  initial: baseInitialReviewVoteState,
  key: reviewVoteKey,
  mergeResult: (state, dir, result) => ({
    ...state,
    usefulCount: result.usefulCount ?? state.usefulCount,
    uselessCount: result.uselessCount ?? state.uselessCount,
    voted: dir,
  }),
  persistence: {
    cache: reviewVoteCache,
    hydrate: (stored) => {
      const hydrated: Partial<ReviewVoteState> = {
        voted: voteDirection(stored),
      };
      if (typeof stored.usefulCount === "number") {
        hydrated.usefulCount = stored.usefulCount;
      }
      if (typeof stored.uselessCount === "number") {
        hydrated.uselessCount = stored.uselessCount;
      }
      return hydrated;
    },
    serialize: (state) => ({
      type: state.voted ?? "useful",
      usefulCount: state.usefulCount,
      uselessCount: state.uselessCount,
    }),
  },
  toItem: reviewWithVoteState,
  votedOf: (state) => state.voted,
  withVoted: (state, dir) => ({ ...state, voted: dir }),
});

export { reviewVoteApi };
export type { ReviewVoteDirection, ReviewVoteState };
