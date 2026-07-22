import type { AccountActionGuard, Comment } from "@/modules/subject/domain";
import { Section } from "@/shared/components/layout/section";

import { getSubjectSectionCopy } from "../navigation/section-copy";
import type { CommentVoteCallback } from "../runtime/types";
import type { VotePersistOptions } from "../voting/vote-state";
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
      {...(subjectId
        ? {
            moreLink: {
              href: `https://movie.douban.com/subject/${subjectId}/comments?status=P`,
              text: "查看全部 →",
            },
          }
        : {})}
      title={getSubjectSectionCopy("comments").sectionTitle}
    >
      <div class="atv-comments">
        {comments.map((comment) => {
          const voteState = getVoteState?.(comment);
          return (
            <CommentCard
              {...(canVote ? { canVote } : {})}
              comment={comment}
              key={comment.cid}
              onOpen={onOpen}
              {...(onVoteStateChange ? { onVoteStateChange } : {})}
              onVote={onVote}
              {...(voteState ? { voteState } : {})}
            />
          );
        })}
      </div>
    </Section>
  );
};

export { CommentsSection };
export type { CommentsSectionProps };
