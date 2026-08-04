import { useEffect, useState } from "preact/hooks";

import { SafeImage } from "@/shared/components/common/safe-image";
import { VoteButton } from "@/shared/components/common/vote-button";
import { safeText } from "@/shared/utils/dom";

import type { SubjectComment } from "../domain";

const numberFormatter = new Intl.NumberFormat("zh-CN");

const triggerNativeVote = (doc: Document, commentId: string): void => {
  const item = [
    ...doc.querySelectorAll<HTMLElement>("#comments .comment-item"),
  ].find((candidate) => candidate.dataset.cid === commentId);
  item?.querySelector<HTMLElement>(".vote-comment")?.click();
};

const nativeComment = (doc: Document, commentId: string): HTMLElement | null =>
  [...doc.querySelectorAll<HTMLElement>("#comments .comment-item")].find(
    (candidate) => candidate.dataset.cid === commentId
  ) ?? null;

const votesFromNativeComment = (
  doc: Document,
  commentId: string,
  fallback: SubjectComment["votes"]
): SubjectComment["votes"] => {
  const item = nativeComment(doc, commentId);
  if (!item) {
    return fallback;
  }
  const count = Number(item.querySelector(".vote-count")?.textContent?.trim());
  const canVote = item.querySelector(".vote-comment") !== null;
  const requiresLogin =
    !canVote && item.querySelector(".comment-vote .a_show_login") !== null;
  return {
    canVote,
    count: Number.isSafeInteger(count) && count >= 0 ? count : fallback.count,
    requiresLogin,
    voted:
      !canVote &&
      /已投票|已赞|已推荐/u.test(safeText(item.querySelector(".comment-vote"))),
  };
};

const Avatar = ({ comment }: { comment: SubjectComment }) => (
  <SafeImage
    alt={`${comment.author.name}的头像`}
    className="atv-subject-comments-avatar"
    fallback={
      <span aria-hidden="true" class="atv-subject-comments-avatar is-fallback">
        {comment.author.name.slice(0, 1)}
      </span>
    }
    src={comment.author.avatar}
  />
);

const Rating = ({ rating }: { rating: number | null }) => {
  if (!rating) {
    return null;
  }

  return (
    <span aria-label={`${rating} 星`} class="atv-subject-comments-rating">
      {"★".repeat(rating)}
    </span>
  );
};

const CommentTime = ({ time }: Pick<SubjectComment, "time">) => {
  if (!time) {
    return null;
  }

  if (time.href) {
    return (
      <a class="atv-subject-comments-time" href={time.href}>
        {time.label}
      </a>
    );
  }

  return <span class="atv-subject-comments-time">{time.label}</span>;
};

const Comment = ({
  comment,
  doc,
  onLoginRequired,
}: {
  comment: SubjectComment;
  doc: Document;
  onLoginRequired: () => void;
}) => {
  const [votes, setVotes] = useState(comment.votes);

  useEffect(() => {
    const item = nativeComment(doc, comment.id);
    const view = doc.defaultView ?? window;
    if (!item || !view.MutationObserver) {
      return;
    }
    const synchronizeVotes = (): void => {
      setVotes((current) => votesFromNativeComment(doc, comment.id, current));
    };
    const observer = new view.MutationObserver(synchronizeVotes);
    observer.observe(item, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [comment.id, doc]);

  const identity = (
    <>
      <Avatar comment={comment} />
      <span class="atv-subject-comments-author-name">
        {comment.author.name}
      </span>
    </>
  );

  return (
    <article class="atv-subject-comments-item">
      <header class="atv-subject-comments-item-header">
        {comment.author.href ? (
          <a class="atv-subject-comments-author" href={comment.author.href}>
            {identity}
          </a>
        ) : (
          <span class="atv-subject-comments-author is-static">{identity}</span>
        )}
        <div class="atv-subject-comments-meta">
          <Rating rating={comment.rating} />
          <CommentTime time={comment.time} />
          {comment.location ? (
            <span class="atv-subject-comments-location">
              {comment.location}
            </span>
          ) : null}
        </div>
      </header>
      <div class="atv-subject-comments-reading-row">
        <p class="atv-subject-comments-content">{comment.content}</p>
        <div aria-label="短评共识刻度" class="atv-subject-comments-consensus">
          <VoteButton
            ariaLabel={`有用，${numberFormatter.format(votes.count)} 人觉得有用`}
            className="atv-comment-votes atv-subject-comments-vote"
            count={votes.count}
            disabled={votes.voted || (!votes.canVote && !votes.requiresLogin)}
            onVote={() => {
              if (votes.requiresLogin) {
                onLoginRequired();
                return;
              }
              if (votes.canVote) {
                triggerNativeVote(doc, comment.id);
                setVotes((current) =>
                  votesFromNativeComment(doc, comment.id, current)
                );
              }
            }}
            voted={votes.voted}
          />
        </div>
      </div>
    </article>
  );
};

export { Avatar, Comment, CommentTime, Rating };
export type { SubjectComment } from "../domain";
