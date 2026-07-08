import { IconExpand } from "../../../components/common/icons";
import { Stars } from "../../../components/common/stars";
import type { AccountActionGuard, Comment } from "../../../types";
import type { CommentVoteCallback } from "../types";
import { CommentAvatar } from "./comment-avatar";
import { CommentVoteButton } from "./comment-vote-button";

interface CommentCardProps {
  canVote?: AccountActionGuard;
  comment: Comment;
  onOpen: (comment: Comment) => void;
  onVote: CommentVoteCallback;
}

const CommentCard = ({
  canVote,
  comment,
  onOpen,
  onVote,
}: CommentCardProps) => (
  <div class="atv-comment-card" data-cid={comment.cid || undefined}>
    <div class="atv-comment-top">
      <CommentAvatar className="atv-comment-avatar" comment={comment} />
      <div class="atv-comment-meta">
        {comment.link ? (
          <a
            class="atv-comment-author"
            href={comment.link}
            rel="noopener"
            target="_blank"
          >
            {comment.name}
          </a>
        ) : (
          <div class="atv-comment-author">{comment.name}</div>
        )}
        {comment.stars > 0 ? (
          <Stars
            className="atv-comment-stars"
            outOfFive
            score={comment.stars}
          />
        ) : null}
      </div>
    </div>
    <button
      class="atv-comment-body"
      onClick={(event) => {
        if (
          (event.currentTarget as HTMLElement)
            .closest(".atv-comment-card")
            ?.classList.contains("has-overflow")
        ) {
          onOpen(comment);
        }
      }}
      type="button"
    >
      <span class="atv-comment-body-text">{comment.content}</span>
    </button>
    <div class="atv-comment-foot">
      <span>{comment.time || ""}</span>
      <div class="atv-comment-foot-right">
        <button
          aria-label="展开短评"
          class="atv-comment-expand"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(comment);
          }}
          type="button"
        >
          <IconExpand />
        </button>
        <CommentVoteButton
          canVote={canVote}
          cid={comment.cid}
          className="atv-comment-votes"
          count={comment.votes}
          onVote={onVote}
          voted={comment.voted}
        />
      </div>
    </div>
  </div>
);

export { CommentCard };
export type { CommentCardProps };
