import { useLayoutEffect, useRef, useState } from "preact/hooks";

import { IconExpand } from "@/components/common/icons";
import { Stars } from "@/components/common/stars";
import type { AccountActionGuard, Comment } from "@/types";

import type { CommentVoteCallback } from "../types";
import type { VotePersistOptions } from "../vote-state";
import { CommentAvatar } from "./comment-avatar";
import { CommentVoteButton } from "./comment-vote-button";
import type { CommentVoteState } from "./comment-vote-state";

type CommentCardProps = {
  canVote?: AccountActionGuard;
  comment: Comment;
  onOpen: (comment: Comment) => void;
  onVoteStateChange?: (
    comment: Comment,
    state: CommentVoteState,
    options?: VotePersistOptions
  ) => void;
  onVote: CommentVoteCallback;
  voteState?: CommentVoteState;
};

const CommentCard = ({
  canVote,
  comment,
  onOpen,
  onVote,
  onVoteStateChange,
  voteState,
}: CommentCardProps) => {
  const bodyRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }
    const measure = (): void => {
      setIsOverflowing(body.scrollHeight > body.clientHeight);
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(body);
    return () => observer?.disconnect();
  }, [comment.content]);

  return (
    <div
      class={`atv-comment-card${isOverflowing ? " has-overflow" : ""}`}
      data-cid={comment.cid || undefined}
    >
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
        onClick={() => {
          if (isOverflowing) {
            onOpen(comment);
          }
        }}
        type="button"
      >
        <span class="atv-comment-body-text" ref={bodyRef}>
          {comment.content}
        </span>
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
            onStateChange={
              onVoteStateChange
                ? (state, options) => onVoteStateChange(comment, state, options)
                : undefined
            }
            onVote={onVote}
            state={voteState}
            voted={comment.voted}
          />
        </div>
      </div>
    </div>
  );
};

export { CommentCard };
export type { CommentCardProps };
