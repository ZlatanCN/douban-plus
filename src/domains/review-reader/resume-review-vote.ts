import { runVoteTransition } from "@/shared/voting/use-vote-action";
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
  await runVoteTransition(
    reviewVoteApi,
    {
      getState: () => owner.getVoteState(review),
      onVote: (dir) => onVote(reviewNumericId(review.id), dir),
      setState: (state, options) => owner.setVoteState(review, state, options),
    },
    direction
  );
};

export { resumeReviewVote };
export type { ReviewVoteStateOwner };
