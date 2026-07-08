import { useState } from "preact/hooks";

import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "../../../types";
import { reviewNumericId } from "./review-identity";

interface ReviewVoteButtonsProps {
  canVote?: AccountActionGuard;
  onVote?: ReviewVoteCallback;
  review: Review;
  size?: "normal" | "large";
}

type VoteDirection = "useful" | "useless";

const ReviewVoteButtons = ({
  canVote,
  onVote,
  review,
  size = "normal",
}: ReviewVoteButtonsProps) => {
  const [counts, setCounts] = useState({
    useful: review.usefulCount ?? 0,
    useless: review.uselessCount ?? 0,
  });
  const [voted, setVoted] = useState<VoteDirection | null>(null);
  const [loading, setLoading] = useState(false);

  const vote = async (type: VoteDirection): Promise<void> => {
    if (loading || voted === type || !onVote) {
      return;
    }
    if (canVote && !canVote()) {
      return;
    }

    const previous = { counts, voted };
    setLoading(true);
    setVoted(type);
    setCounts((current) => ({
      useful: current.useful + (type === "useful" ? 1 : 0),
      useless: current.useless + (type === "useless" ? 1 : 0),
    }));

    const result = await onVote(reviewNumericId(review.id), type);
    if (result.ok) {
      setCounts((current) => ({
        useful: result.usefulCount ?? current.useful,
        useless: result.uselessCount ?? current.useless,
      }));
    } else {
      setCounts(previous.counts);
      setVoted(previous.voted);
    }
    setLoading(false);
  };

  const sizeClass = size === "large" ? " is-lg" : "";

  return (
    <>
      <button
        class={`atv-vote-btn up${voted === "useful" ? " is-voted" : ""}${sizeClass}`}
        onClick={(event) => {
          event.stopPropagation();
          void vote("useful");
        }}
        type="button"
      >
        有用 {counts.useful}
      </button>
      <button
        class={`atv-vote-btn down${voted === "useless" ? " is-voted" : ""}${sizeClass}`}
        onClick={(event) => {
          event.stopPropagation();
          void vote("useless");
        }}
        type="button"
      >
        没用 {counts.useless}
      </button>
    </>
  );
};

export { ReviewVoteButtons };
export type { ReviewVoteButtonsProps };
