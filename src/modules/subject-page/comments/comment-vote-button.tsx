import { useState } from "preact/hooks";

import type { AccountActionGuard } from "../../../types";
import type { CommentVoteCallback } from "../types";

type CommentVoteButtonProps = {
  canVote?: AccountActionGuard;
  cid: string;
  className: string;
  count: number;
  onVote: CommentVoteCallback;
  voted: boolean;
};

const CommentVoteButton = ({
  canVote,
  cid,
  className,
  count,
  onVote,
  voted,
}: CommentVoteButtonProps) => {
  const [state, setState] = useState({ count, voted });
  const [loading, setLoading] = useState(false);

  const vote = async (): Promise<void> => {
    if (loading || state.voted || !cid) {
      return;
    }
    if (canVote && !canVote()) {
      return;
    }

    setLoading(true);
    const previous = state;
    setState((current) => ({ count: current.count + 1, voted: true }));
    const result = await onVote(cid);
    if (result.ok) {
      setState((current) => ({
        count: result.count ?? current.count,
        voted: true,
      }));
    } else {
      setState(previous);
    }
    setLoading(false);
  };

  return (
    <button
      class={`${className}${state.voted ? " is-voted" : ""}`}
      disabled={loading || state.voted || !cid}
      onClick={(event) => {
        event.stopPropagation();
        void vote();
      }}
      type="button"
    >
      有用 {state.count}
    </button>
  );
};

export { CommentVoteButton };
export type { CommentVoteButtonProps };
