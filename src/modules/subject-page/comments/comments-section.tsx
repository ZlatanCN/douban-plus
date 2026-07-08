import { useEffect, useRef } from "preact/hooks";

import { Section } from "../../../components/layout/section";
import type { AccountActionGuard, Comment } from "../../../types";
import type { CommentVoteCallback } from "../types";
import { CommentCard } from "./comment-card";

type CommentsSectionProps = {
  canVote?: AccountActionGuard;
  comments: Comment[];
  onOpen: (comment: Comment) => void;
  onVote: CommentVoteCallback;
  subjectId: string;
};

const CommentsSection = ({
  canVote,
  comments,
  onOpen,
  onVote,
  subjectId,
}: CommentsSectionProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      const cards =
        gridRef.current?.querySelectorAll<HTMLElement>(".atv-comment-card") ??
        [];
      for (const card of cards) {
        const body = card.querySelector<HTMLElement>(".atv-comment-body-text");
        if (body && body.scrollHeight > body.clientHeight) {
          card.classList.add("has-overflow");
        }
      }
    });
  }, [comments]);

  if (!comments.length) {
    return null;
  }

  return (
    <Section
      id="atv-comments"
      moreLink={
        subjectId
          ? {
              href: `https://movie.douban.com/subject/${subjectId}/comments?status=P`,
              text: "查看全部 →",
            }
          : undefined
      }
      title="热门短评"
    >
      <div class="atv-comments" ref={gridRef}>
        {comments.map((comment) => (
          <CommentCard
            canVote={canVote}
            comment={comment}
            key={comment.cid}
            onOpen={onOpen}
            onVote={onVote}
          />
        ))}
      </div>
    </Section>
  );
};

export { CommentsSection };
export type { CommentsSectionProps };
