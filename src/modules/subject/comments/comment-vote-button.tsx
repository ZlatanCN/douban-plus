import { useState } from "preact/hooks";

import { IconThumb } from "@/components/common/icons";
import type { AccountActionGuard } from "@/types";

import type { CommentVoteCallback } from "../types";
import { useVoteAction } from "../use-vote-action";
import type { VotePersistOptions } from "../vote-state";
import { commentVoteApi } from "./comment-vote-state";
import type { CommentVoteState } from "./comment-vote-state";

type CommentVoteButtonProps = {
  canVote?: AccountActionGuard;
  cid: string;
  className: string;
  count: number;
  onStateChange?: (
    state: CommentVoteState,
    options?: VotePersistOptions
  ) => void;
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
  const voteState = state ?? localState;

  const setVoteState = (
    nextState: CommentVoteState,
    options?: VotePersistOptions
  ): void => {
    if (onStateChange) {
      onStateChange(nextState, options);
    } else {
      setLocalState(nextState);
    }
  };

  const { loading, vote } = useVoteAction(commentVoteApi, {
    ...(canVote ? { canVote } : {}),
    getState: () => voteState,
    onVote: () => onVote(cid),
    setState: setVoteState,
  });

  const handleVote = (): void => {
    if (!cid) {
      return;
    }
    void vote("up");
  };

  return (
    <button
      aria-label={`有用，${voteState.count} 人觉得有用`}
      aria-pressed={voteState.voted}
      class={`${className}${voteState.voted ? " is-voted" : ""}`}
      disabled={loading || voteState.voted || !cid}
      onClick={(event) => {
        event.stopPropagation();
        handleVote();
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
