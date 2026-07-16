import { Section } from "@/components/layout/section";
import type { AccountActionGuard, Comment } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";
import type { CommentVoteCallback } from "../types";
import type { VotePersistOptions } from "../vote-state";
import { CommentCard } from "./comment-card";
import type { CommentVoteState } from "./comment-vote-state";

type CommentsSectionProps = {
  canVote?: AccountActionGuard;
  comments: Comment[];
  getVoteState?: (comment: Comment) => CommentVoteState;
  onOpen: (comment: Comment) => void;
  onVoteStateChange?: (
    comment: Comment,
    state: CommentVoteState,
    options?: VotePersistOptions
  ) => void;
  onVote: CommentVoteCallback;
  subjectId: string;
};

const CommentsSection = ({
  canVote,
  comments,
  getVoteState,
  onOpen,
  onVoteStateChange,
  onVote,
  subjectId,
}: CommentsSectionProps) => {
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
      title={getSubjectSectionCopy("comments").sectionTitle}
    >
      <div class="atv-comments">
        {comments.map((comment) => (
          <CommentCard
            comment={comment}
            canVote={canVote}
            key={comment.cid}
            onOpen={onOpen}
            onVoteStateChange={onVoteStateChange}
            onVote={onVote}
            voteState={getVoteState?.(comment)}
          />
        ))}
      </div>
    </Section>
  );
};

export { CommentsSection };
export type { CommentsSectionProps };
