import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "@/modules/subject/domain";
import { IconVoteTriangle } from "@/shared/components/common/icons";

import { useVoteAction } from "../voting/use-vote-action";
import { useVoteControl } from "../voting/use-vote-control";
import type { VotePersistOptions } from "../voting/vote-state";
import { reviewNumericId } from "./review-identity";
import { reviewVoteApi } from "./review-vote-state";
import type { ReviewVoteDirection, ReviewVoteState } from "./review-vote-state";

type ReviewVoteButtonsProps = {
  canVote?: AccountActionGuard;
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
            nextState: ReviewVoteState,
            options?: VotePersistOptions
          ) => onStateChange(review, nextState, options),
        }
      : {}),
    ...(state ? { state } : {}),
  });

  const { loading, vote } = useVoteAction(reviewVoteApi, {
    ...(canVote ? { canVote } : {}),
    getState: () => voteState,
    onVote: (dir) =>
      onVote
        ? onVote(reviewNumericId(review.id), dir)
        : Promise.resolve({ ok: false }),
    setState: setVoteState,
  });

  const sizeClass = size === "large" ? " is-lg" : "";

  const handleVote = (dir: ReviewVoteDirection): void => {
    if (!onVote) {
      return;
    }
    void vote(dir);
  };

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
        class={`atv-vote-btn down${
          voteState.voted === "useless" ? " is-voted" : ""
        }${sizeClass}`}
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
