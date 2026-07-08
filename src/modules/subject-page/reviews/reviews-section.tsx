import { Section } from "../../../components/layout/section";
import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "../../../types";
import { ReviewCard } from "./review-card";

interface ReviewsSectionProps {
  canVote?: AccountActionGuard;
  isTV: boolean;
  onOpen: (review: Review) => void;
  onVote?: ReviewVoteCallback;
  reviews: Review[];
  subjectId: string;
}

const ReviewsSection = ({
  canVote,
  isTV,
  onOpen,
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
      title={isTV ? "热门剧评" : "热门影评"}
    >
      <div class="atv-reviews">
        {reviews.map((review) => (
          <ReviewCard
            canVote={canVote}
            key={review.id}
            onOpen={onOpen}
            onVote={onVote}
            review={review}
          />
        ))}
      </div>
    </Section>
  );
};

export { ReviewsSection };
export type { ReviewsSectionProps };
