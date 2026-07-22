import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "@/modules/subject/domain";
import { Section } from "@/shared/components/layout/section";

import { getSubjectSectionCopy } from "../navigation/section-copy";
import { ReviewCard } from "./review-card";
import type { ReviewVoteState } from "./review-vote-state";

type ReviewsSectionProps = {
  canVote?: AccountActionGuard;
  getVoteState?: (review: Review) => ReviewVoteState;
  isTV: boolean;
  onOpen: (review: Review) => void;
  onVoteStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: { persist?: boolean }
  ) => void;
  onVote?: ReviewVoteCallback;
  reviews: Review[];
  subjectId: string;
};

const ReviewsSection = ({
  canVote,
  getVoteState,
  isTV,
  onOpen,
  onVoteStateChange,
  onVote,
  reviews,
  subjectId,
}: ReviewsSectionProps) => {
  if (!reviews.length) {
    return null;
  }

  return (
    <Section
      id="atv-reviews"
      moreLink={{
        href: `https://movie.douban.com/subject/${subjectId}/reviews`,
        text: "查看全部 →",
      }}
      title={
        getSubjectSectionCopy(isTV ? "tvReviews" : "movieReviews").sectionTitle
      }
    >
      <div class="atv-reviews">
        {reviews.map((review) => {
          const voteState = getVoteState?.(review);
          return (
            <ReviewCard
              {...(canVote ? { canVote } : {})}
              key={review.id}
              onOpen={onOpen}
              {...(onVote ? { onVote } : {})}
              {...(onVoteStateChange ? { onVoteStateChange } : {})}
              review={review}
              {...(voteState ? { voteState } : {})}
            />
          );
        })}
      </div>
    </Section>
  );
};

export { ReviewsSection };
export type { ReviewsSectionProps };
