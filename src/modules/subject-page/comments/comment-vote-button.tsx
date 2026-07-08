import { useState } from "preact/hooks";

import { IconThumb } from "../../../components/common/icons";
import type { AccountActionGuard } from "../../../types";
import type { CommentVoteCallback } from "../types";
import {
  optimisticCommentVoteState,
  resolvedCommentVoteState,
} from "./comment-vote-state";
import type { CommentVoteState } from "./comment-vote-state";

type CommentVoteButtonProps = {
  canVote?: AccountActionGuard;
  cid: string;
  className: string;
  count: number;
  onStateChange?: (state: CommentVoteState) => void;
  onVote: CommentVoteCallback;
  state?: CommentVoteState;
  voted: boolean;
};

const CommentVoteButton = ({
  canVote,
  cid,
  className,
  count,
  onStateChange,
  onVote,
  state,
  voted,
}: CommentVoteButtonProps) => {
  const [localState, setLocalState] = useState<CommentVoteState>({
    count,
    voted,
  });
  const [loading, setLoading] = useState(false);
  const voteState = state ?? localState;

  const setVoteState = (nextState: CommentVoteState): void => {
    if (onStateChange) {
      onStateChange(nextState);
    } else {
      setLocalState(nextState);
    }
  };

  const vote = async (): Promise<void> => {
    if (loading || voteState.voted || !cid) {
      return;
    }
    if (canVote && !canVote()) {
      return;
    }

    setLoading(true);
    const previous = voteState;
    const optimistic = optimisticCommentVoteState(voteState);
    setVoteState(optimistic);
    const result = await onVote(cid);
    if (result.ok) {
      setVoteState(resolvedCommentVoteState(optimistic, result));
    } else {
      setVoteState(previous);
    }
    setLoading(false);
  };

  return (
    <button
      aria-label={`有用，${voteState.count} 人觉得有用`}
      aria-pressed={voteState.voted}
      class={`${className}${voteState.voted ? " is-voted" : ""}`}
      disabled={loading || voteState.voted || !cid}
      onClick={(event) => {
        event.stopPropagation();
        void vote();
      }}
      type="button"
    >
      <IconThumb />
      <span class="atv-vote-count">{voteState.count}</span>
    </button>
  );
};

export { CommentVoteButton };
export type { CommentVoteButtonProps };
