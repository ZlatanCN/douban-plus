import type { Comment } from "../../../types";

type CommentVoteState = {
  count: number;
  voted: boolean;
};

const commentVoteKey = (comment: Comment): string =>
  comment.cid || comment.link;

const initialCommentVoteState = (comment: Comment): CommentVoteState => ({
  count: comment.votes,
  voted: comment.voted,
});

const optimisticCommentVoteState = (
  state: CommentVoteState
): CommentVoteState => ({
  count: state.count + 1,
  voted: true,
});

const resolvedCommentVoteState = (
  current: CommentVoteState,
  result: { count?: number; ok: boolean }
): CommentVoteState => ({
  count: result.count ?? current.count,
  voted: true,
});

const commentWithVoteState = (
  comment: Comment,
  state: CommentVoteState
): Comment => ({
  ...comment,
  voted: state.voted,
  votes: state.count,
});

export {
  commentVoteKey,
  commentWithVoteState,
  initialCommentVoteState,
  optimisticCommentVoteState,
  resolvedCommentVoteState,
};
export type { CommentVoteState };
