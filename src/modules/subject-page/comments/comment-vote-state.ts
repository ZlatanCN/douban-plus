import type { Comment } from "@/types";
import { createCache } from "@/utils/cache";

import { createVoteState } from "../vote-state";

type CommentVoteState = {
  count: number;
  voted: boolean;
};

type CommentVoteResult = { ok: boolean; count?: number };

type StoredCommentVote = { type: "up"; count: number };

const commentVoteCache = createCache<StoredCommentVote>(
  "atv:comment:vote",
  365 * 24 * 60 * 60 * 1000
);

const commentVoteKey = (comment: Comment): string =>
  comment.cid || comment.link;

const baseInitialCommentVoteState = (comment: Comment): CommentVoteState => ({
  count: comment.votes,
  voted: comment.voted,
});

const commentWithVoteState = (
  comment: Comment,
  state: CommentVoteState
): Comment => ({
  ...comment,
  voted: state.voted,
  votes: state.count,
});

const {
  initial: initialCommentVoteState,
  optimistic: optimisticCommentVoteState,
  resolve: resolvedCommentVoteState,
  persist: persistCommentVoteState,
  votedOf: commentVotedOf,
} = createVoteState<
  CommentVoteState,
  "up",
  Comment,
  CommentVoteResult,
  StoredCommentVote
>({
  countKey: () => "count",
  initial: baseInitialCommentVoteState,
  key: commentVoteKey,
  mergeResult: (state, _dir, result) => ({
    ...state,
    count: result.count ?? state.count,
    voted: true,
  }),
  persistence: {
    cache: commentVoteCache,
    hydrate: (stored) => {
      const hydrated: Partial<CommentVoteState> = { voted: true };
      if (typeof stored.count === "number") {
        hydrated.count = stored.count;
      }
      return hydrated;
    },
    serialize: (state) => ({ count: state.count, type: "up" }),
  },
  toItem: commentWithVoteState,
  votedOf: (state) => (state.voted ? "up" : null),
  withVoted: (state, dir) => ({ ...state, voted: dir === "up" }),
});

export {
  commentVoteKey,
  commentVotedOf,
  commentWithVoteState,
  initialCommentVoteState,
  optimisticCommentVoteState,
  persistCommentVoteState,
  resolvedCommentVoteState,
};
export type { CommentVoteState };
