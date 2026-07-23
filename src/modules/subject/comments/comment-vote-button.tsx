import type { AccountActionGuard, Comment } from "@/modules/subject/domain";
import { IconThumb } from "@/shared/components/common/icons";

import type { CommentVoteCallback } from "../runtime/types";
import { useVoteAction } from "../voting/use-vote-action";
import { useVoteControl } from "../voting/use-vote-control";
import type { VotePersistOptions } from "../voting/vote-state";
import { commentVoteApi } from "./comment-vote-state";
import type { CommentVoteState } from "./comment-vote-state";

type CommentVoteButtonProps = {
  canVote?: AccountActionGuard;
  className: string;
  comment: Comment;
  onStateChange?: (
    state: CommentVoteState,
    options?: VotePersistOptions
  ) => void;
  onVote: CommentVoteCallback;
  state?: CommentVoteState;
};

const CommentVoteButton = ({
  canVote,
  className,
  comment,
  onStateChange,
  onVote,
  state,
}: CommentVoteButtonProps) => {
  const { setVoteState, voteState } = useVoteControl({
    api: commentVoteApi,
    item: comment,
    ...(onStateChange ? { onStateChange } : {}),
    ...(state ? { state } : {}),
  });

  const { loading, vote } = useVoteAction(commentVoteApi, {
    ...(canVote ? { canVote } : {}),
    getState: () => voteState,
    onVote: () => onVote(comment.cid),
    setState: setVoteState,
  });

  const handleVote = (): void => {
    if (!comment.cid) {
      return;
    }
    void vote("up");
  };

  return (
    <button
      aria-label={`有用，${voteState.count} 人觉得有用`}
      aria-pressed={voteState.voted}
      class={`${className}${voteState.voted ? " is-voted" : ""}`}
      disabled={loading || voteState.voted || !comment.cid}
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
