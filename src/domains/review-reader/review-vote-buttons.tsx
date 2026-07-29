import { IconVoteTriangle } from "@/shared/components/common/icons";
import { useVoteAction } from "@/shared/voting/use-vote-action";
import { useVoteControl } from "@/shared/voting/use-vote-control";
import type { VotePersistOptions } from "@/shared/voting/vote-state";

import type { AccountActionGuard, Review, ReviewVoteCallback } from "./domain";
import { reviewNumericId } from "./review-identity";
import { reviewVoteApi } from "./review-vote-state";
import type { ReviewVoteDirection, ReviewVoteState } from "./review-vote-state";

type ReviewVoteButtonsProps = {
  canVote?: AccountActionGuard;
  onAuthenticationRequired?: (
    review: Review,
    direction: ReviewVoteDirection
  ) => void;
  onStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: VotePersistOptions
  ) => void;
  onVote?: ReviewVoteCallback;
  review: Review;
  size?: "normal" | "large";
  state?: ReviewVoteState;
};

const ReviewVoteButtons = ({
  canVote,
  onAuthenticationRequired,
  onStateChange,
  onVote,
  review,
  size = "normal",
  state,
}: ReviewVoteButtonsProps) => {
  const { setVoteState, voteState } = useVoteControl({
    api: reviewVoteApi,
    item: review,
    ...(onStateChange
      ? {
          onStateChange: (
            next: ReviewVoteState,
            options?: VotePersistOptions
          ) => onStateChange(review, next, options),
        }
      : {}),
    ...(state ? { state } : {}),
  });
  const { loading, vote } = useVoteAction(reviewVoteApi, {
    getState: () => voteState,
    onVote: (direction) =>
      onVote
        ? onVote(reviewNumericId(review.id), direction)
        : Promise.resolve({ ok: false }),
    setState: setVoteState,
  });
  const handleVote = (direction: ReviewVoteDirection): void => {
    if (!onVote) {
      return;
    }
    if (canVote && !canVote()) {
      onAuthenticationRequired?.(review, direction);
      return;
    }
    void vote(direction);
  };
  const sizeClass = size === "large" ? " is-lg" : "";
  return (
    <>
      <button
        aria-label={`有用，${voteState.usefulCount} 人觉得有用`}
        aria-pressed={voteState.voted === "useful"}
        class={`atv-vote-btn up${voteState.voted === "useful" ? " is-voted" : ""}${sizeClass}`}
        disabled={!onVote || loading || voteState.voted === "useful"}
        onClick={(event) => {
          event.stopPropagation();
          handleVote("useful");
        }}
        type="button"
      >
        <IconVoteTriangle />
        <span class="atv-vote-count">{voteState.usefulCount}</span>
      </button>
      <button
        aria-label={`没用，${voteState.uselessCount} 人觉得没用`}
        aria-pressed={voteState.voted === "useless"}
        class={`atv-vote-btn down${voteState.voted === "useless" ? " is-voted" : ""}${sizeClass}`}
        disabled={!onVote || loading || voteState.voted === "useless"}
        onClick={(event) => {
          event.stopPropagation();
          handleVote("useless");
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
