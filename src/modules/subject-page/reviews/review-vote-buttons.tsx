import { useState } from "preact/hooks";

import { IconVoteTriangle } from "@/components/common/icons";
import type { AccountActionGuard, Review, ReviewVoteCallback } from "@/types";

import { reviewNumericId } from "./review-identity";
import {
  initialReviewVoteState,
  optimisticReviewVoteState,
  persistReviewVoteState,
  resolvedReviewVoteState,
} from "./review-vote-state";
import type { ReviewVoteDirection, ReviewVoteState } from "./review-vote-state";

type ReviewVoteButtonsProps = {
  canVote?: AccountActionGuard;
  onStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: { persist?: boolean }
  ) => void;
  onVote?: ReviewVoteCallback;
  review: Review;
  size?: "normal" | "large";
  state?: ReviewVoteState;
};

const ReviewVoteButtons = ({
  canVote,
  onStateChange,
  onVote,
  review,
  size = "normal",
  state,
}: ReviewVoteButtonsProps) => {
  const [localState, setLocalState] = useState<ReviewVoteState>(() =>
    initialReviewVoteState(review)
  );
  const [loading, setLoading] = useState(false);
  const voteState = state ?? localState;

  const setVoteState = (
    nextState: ReviewVoteState,
    options?: { persist?: boolean }
  ): void => {
    if (onStateChange) {
      onStateChange(review, nextState, options);
    } else {
      setLocalState(nextState);
      if (options?.persist) {
        persistReviewVoteState(review, nextState);
      }
    }
  };

  const vote = async (type: ReviewVoteDirection): Promise<void> => {
    if (loading || voteState.voted === type || !onVote) {
      return;
    }
    if (canVote && !canVote()) {
      return;
    }

    const previous = voteState;
    setLoading(true);
    setVoteState(optimisticReviewVoteState(voteState, type));

    const result = await onVote(reviewNumericId(review.id), type);
    if (result.ok) {
      setVoteState(resolvedReviewVoteState(voteState, type, result), {
        persist: true,
      });
    } else {
      setVoteState(previous);
    }
    setLoading(false);
  };

  const sizeClass = size === "large" ? " is-lg" : "";

  return (
    <>
      <button
        aria-label={`有用，${voteState.usefulCount} 人觉得有用`}
        aria-pressed={voteState.voted === "useful"}
        class={`atv-vote-btn up${
          voteState.voted === "useful" ? " is-voted" : ""
        }${sizeClass}`}
        disabled={!onVote || loading || voteState.voted === "useful"}
        onClick={(event) => {
          event.stopPropagation();
          void vote("useful");
        }}
        type="button"
      >
        <IconVoteTriangle />
        <span class="atv-vote-count">{voteState.usefulCount}</span>
      </button>
      <button
        aria-label={`没用，${voteState.uselessCount} 人觉得没用`}
        aria-pressed={voteState.voted === "useless"}
        class={`atv-vote-btn down${
          voteState.voted === "useless" ? " is-voted" : ""
        }${sizeClass}`}
        disabled={!onVote || loading || voteState.voted === "useless"}
        onClick={(event) => {
          event.stopPropagation();
          void vote("useless");
        }}
        type="button"
      >
        <IconVoteTriangle />
        <span class="atv-vote-count">{voteState.uselessCount}</span>
      </button>
    </>
  );
};

export { ReviewVoteButtons };
export type { ReviewVoteButtonsProps };
