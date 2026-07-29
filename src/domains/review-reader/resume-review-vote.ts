import type { VotePersistOptions } from "@/shared/voting/vote-state";

import type { Review, ReviewVoteCallback } from "./domain";
import { reviewNumericId } from "./review-identity";
import { reviewVoteApi } from "./review-vote-state";
import type { ReviewVoteDirection, ReviewVoteState } from "./review-vote-state";

type ReviewVoteStateOwner = {
  getVoteState: (review: Review) => ReviewVoteState;
  setVoteState: (
    review: Review,
    state: ReviewVoteState,
    options?: VotePersistOptions
  ) => void;
};

const resumeReviewVote = async (
  review: Review,
  direction: ReviewVoteDirection,
  onVote: ReviewVoteCallback,
  owner: ReviewVoteStateOwner
): Promise<void> => {
  const previous = owner.getVoteState(review);
  const optimistic = reviewVoteApi.optimistic(previous, direction);
  owner.setVoteState(review, optimistic);
  const result = await onVote(reviewNumericId(review.id), direction);
  owner.setVoteState(
    review,
    result.ok ? reviewVoteApi.resolve(optimistic, direction, result) : previous,
    result.ok ? { persist: true } : undefined
  );
};

export { resumeReviewVote };
export type { ReviewVoteStateOwner };
