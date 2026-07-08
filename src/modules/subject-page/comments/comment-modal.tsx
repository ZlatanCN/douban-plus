import { Stars } from "../../../components/common/stars";
import { ModalCloseButton, ModalShell } from "../../../components/modal/index";
import { useModalClose } from "../../../components/modal/modal-close-context";
import type { AccountActionGuard, Comment } from "../../../types";
import type { CommentVoteCallback } from "../types";
import { CommentAvatar } from "./comment-avatar";
import { CommentVoteButton } from "./comment-vote-button";
import type { CommentVoteState } from "./comment-vote-state";

type CommentModalProps = {
  canVote?: AccountActionGuard;
  comment: Comment;
  onClose: () => void;
  onVoteStateChange?: (comment: Comment, state: CommentVoteState) => void;
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
  onVoteStateChange?: (comment: Comment, state: CommentVoteState) => void;
  onVote: CommentVoteCallback;
  voteState?: CommentVoteState;
}) => {
  const handleClose = useModalClose();
  return (
    <>
      <div class="atv-comment-overlay-accent" />
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
          canVote={canVote}
          cid={comment.cid}
          className="atv-comment-overlay-votes"
          count={comment.votes}
          onStateChange={
            onVoteStateChange
              ? (state) => onVoteStateChange(comment, state)
              : undefined
          }
          onVote={onVote}
          state={voteState}
          voted={comment.voted}
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
      canVote={canVote}
      comment={comment}
      onVoteStateChange={onVoteStateChange}
      onVote={onVote}
      voteState={voteState}
    />
  </ModalShell>
);

export { CommentModal };
export type { CommentModalProps };
