import { Stars } from "../../../components/common/stars";
import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "../../../types";
import { reviewDisplayName } from "./review-identity";
import { ReviewVoteButtons } from "./review-vote-buttons";
import type { ReviewVoteState } from "./review-vote-state";

type ReviewCardProps = {
  canVote?: AccountActionGuard;
  onOpen: (review: Review) => void;
  onVoteStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: { persist?: boolean }
  ) => void;
  onVote?: ReviewVoteCallback;
  review: Review;
  voteState?: ReviewVoteState;
};

const ReviewCard = ({
  canVote,
  onOpen,
  onVote,
  onVoteStateChange,
  review,
  voteState,
}: ReviewCardProps) => {
  const displayName = reviewDisplayName(review.name);

  return (
    <article class="atv-review-card" data-rid={review.id || undefined}>
      <button
        aria-label={`展开阅读：${review.title}`}
        class="atv-review-open-button"
        onClick={() => onOpen(review)}
        type="button"
      />
      <div class="atv-review-content">
        <div class="atv-review-top">
          <div
            class="atv-review-avatar"
            style={
              review.avatar
                ? { backgroundImage: `url("${review.avatar}")` }
                : undefined
            }
          >
            {review.avatar ? null : displayName.slice(0, 1).toUpperCase()}
          </div>
          <div class="atv-review-meta">
            {review.link ? (
              <a
                class="atv-review-author"
                href={review.link}
                onClick={(event) => event.stopPropagation()}
                rel="noopener"
                target="_blank"
              >
                {displayName}
              </a>
            ) : (
              <div class="atv-review-author">{displayName}</div>
            )}
            {review.stars > 0 ? (
              <Stars
                className="atv-review-stars"
                outOfFive
                score={review.stars}
              />
            ) : null}
          </div>
        </div>
        <div class="atv-review-title">{review.title}</div>
        <div class="atv-review-excerpt">{review.content}</div>
        <div class="atv-review-foot">
          <span class="atv-review-time">{review.time || ""}</span>
          <span class="atv-review-readmore">展开阅读</span>
          <div class="atv-review-actions" data-rid={review.id || undefined}>
            <ReviewVoteButtons
              canVote={canVote}
              onStateChange={onVoteStateChange}
              onVote={onVote}
              review={review}
              state={voteState}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export { ReviewCard };
export type { ReviewCardProps };
