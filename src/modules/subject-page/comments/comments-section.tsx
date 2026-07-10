import { Section } from "@/components/layout/section";
import type { AccountActionGuard, Comment } from "@/types";

import type { CommentVoteCallback } from "../types";
import { CommentCard } from "./comment-card";
import type { CommentVoteState } from "./comment-vote-state";

type CommentsSectionProps = {
  avatarUrls?: Map<string, string>;
  canVote?: AccountActionGuard;
  comments: Comment[];
  getVoteState?: (comment: Comment) => CommentVoteState;
  onOpen: (comment: Comment) => void;
  onVoteStateChange?: (comment: Comment, state: CommentVoteState) => void;
  onVote: CommentVoteCallback;
  subjectId: string;
};

const CommentsSection = ({
  avatarUrls,
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
      title="热门短评"
    >
      <div class="atv-comments">
        {comments.map((comment) => (
          <CommentCard
            comment={{
              ...comment,
              avatar: avatarUrls?.get(comment.link) || comment.avatar,
            }}
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
