import type { AccountActionGuard, Comment } from "@/modules/subject/domain";
import { Stars } from "@/shared/components/common/stars";
import { ModalCloseButton, ModalShell } from "@/shared/components/modal";
import { useModalClose } from "@/shared/components/modal/modal-close-context";

import type { CommentVoteCallback } from "../runtime/types";
import type { VotePersistOptions } from "../voting/vote-state";
import { CommentAvatar } from "./comment-avatar";
import { CommentVoteButton } from "./comment-vote-button";
import type { CommentVoteState } from "./comment-vote-state";

type CommentModalProps = {
  canVote?: AccountActionGuard;
  comment: Comment;
  onClose: () => void;
  onVoteStateChange?: (
    comment: Comment,
    state: CommentVoteState,
    options?: VotePersistOptions
  ) => void;
  onVote: CommentVoteCallback;
  voteState?: CommentVoteState;
};

const CommentModalContent = ({
  canVote,
  comment,
  onVoteStateChange,
  onVote,
  voteState,
}: {
  canVote?: AccountActionGuard;
  comment: Comment;
  onVoteStateChange?: (
    comment: Comment,
    state: CommentVoteState,
    options?: VotePersistOptions
  ) => void;
  onVote: CommentVoteCallback;
  voteState?: CommentVoteState;
}) => {
  const handleClose = useModalClose();
  return (
    <>
      <div class="atv-modal-accent-bar" />
      <ModalCloseButton
        ariaLabel="关闭短评"
        className="atv-comment-overlay-close"
        onClick={handleClose}
        size={16}
      />
      <div class="atv-comment-overlay-top">
        <CommentAvatar
          className="atv-comment-overlay-avatar"
          comment={comment}
        />
        <div class="atv-comment-overlay-meta">
          {comment.link ? (
            <a
              class="atv-comment-overlay-author"
              href={comment.link}
              rel="noopener"
              target="_blank"
            >
              {comment.name}
            </a>
          ) : (
            <div class="atv-comment-overlay-author">{comment.name}</div>
          )}
          {comment.stars > 0 ? (
            <Stars
              className="atv-comment-overlay-stars"
              outOfFive
              score={comment.stars}
            />
          ) : null}
        </div>
      </div>
      <div class="atv-comment-overlay-body">{comment.content}</div>
      <div class="atv-comment-overlay-foot">
        <span class="atv-comment-overlay-time">{comment.time || ""}</span>
        <CommentVoteButton
          {...(canVote ? { canVote } : {})}
          className="atv-comment-overlay-votes"
          comment={comment}
          {...(onVoteStateChange
            ? {
                onStateChange: (
                  state: CommentVoteState,
                  options?: VotePersistOptions
                ) => onVoteStateChange(comment, state, options),
              }
            : {})}
          onVote={onVote}
          {...(voteState ? { state: voteState } : {})}
        />
      </div>
    </>
  );
};

const CommentModal = ({
  canVote,
  comment,
  onClose,
  onVoteStateChange,
  onVote,
  voteState,
}: CommentModalProps) => (
  <ModalShell
    className="atv-comment-overlay"
    id="atv-comment-overlay"
    onClose={onClose}
    surfaceClassName="atv-comment-overlay-inner"
  >
    <CommentModalContent
      {...(canVote ? { canVote } : {})}
      comment={comment}
      {...(onVoteStateChange ? { onVoteStateChange } : {})}
      onVote={onVote}
      {...(voteState ? { voteState } : {})}
    />
  </ModalShell>
);

export { CommentModal };
export type { CommentModalProps };
