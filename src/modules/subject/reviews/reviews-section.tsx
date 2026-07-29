import { ReviewCard } from "@/domains/review-reader";
import type {
  ReviewVoteDirection,
  ReviewVoteState,
} from "@/domains/review-reader";
import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "@/modules/subject/domain";
import { Section } from "@/shared/components/layout/section";

import { getSubjectSectionCopy } from "../navigation/section-copy";

type ReviewsSectionProps = {
  canVote?: AccountActionGuard;
  getVoteState?: (review: Review) => ReviewVoteState;
  isTV: boolean;
  onAuthenticationRequired?: (
    review: Review,
    direction: ReviewVoteDirection
  ) => void;
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
  onAuthenticationRequired,
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
              {...(onAuthenticationRequired
                ? { onAuthenticationRequired }
                : {})}
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
