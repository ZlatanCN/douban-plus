import { Stars } from "@/shared/components/common/stars";
import type { VotePersistOptions } from "@/shared/voting/vote-state";

import type { AccountActionGuard, Review, ReviewVoteCallback } from "./domain";
import { reviewDisplayName } from "./review-identity";
import { ReviewVoteButtons } from "./review-vote-buttons";
import type { ReviewVoteDirection, ReviewVoteState } from "./review-vote-state";
import { SpoilerNote } from "./spoiler-note";

type ReviewCardProps = {
  canVote?: AccountActionGuard;
  layout?: "compact" | "directory";
  onAuthenticationRequired?: (
    review: Review,
    direction: ReviewVoteDirection
  ) => void;
  onOpen: (review: Review) => void;
  onVote?: ReviewVoteCallback;
  onVoteStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: VotePersistOptions
  ) => void;
  reply?: { href: string; label: string } | null | undefined;
  review: Review;
  voteState?: ReviewVoteState;
};

type ReviewIdentityProps = Pick<ReviewCardProps, "review"> & {
  directory?: boolean;
};

const ReviewAvatar = ({ name, review }: { name: string; review: Review }) => (
  <div
    class="atv-review-avatar"
    style={
      review.avatar ? { backgroundImage: `url("${review.avatar}")` } : undefined
    }
  >
    {review.avatar ? null : name.slice(0, 1).toUpperCase()}
  </div>
);

const ReviewAuthor = ({ name, review }: { name: string; review: Review }) =>
  review.link ? (
    <a
      class="atv-review-author"
      href={review.link}
      onClick={(event) => event.stopPropagation()}
      rel="noopener"
      target="_blank"
    >
      {name}
    </a>
  ) : (
    <span class="atv-review-author">{name}</span>
  );

const ReviewIdentity = ({ directory = false, review }: ReviewIdentityProps) => {
  const name = reviewDisplayName(review.name);
  const stars =
    review.stars > 0 ? (
      <Stars className="atv-review-stars" outOfFive score={review.stars} />
    ) : null;
  const metadata = (
    <div class="atv-review-meta">
      <ReviewAuthor name={name} review={review} />
      {directory ? (
        <>
          {stars ? (
            <div class="atv-review-meta-line atv-review-directory-meta-line">
              {stars}
            </div>
          ) : null}
          {review.time ? (
            <span class="atv-review-time">{review.time}</span>
          ) : null}
        </>
      ) : (
        stars
      )}
    </div>
  );

  if (directory) {
    return (
      <aside class="atv-review-directory-identity">
        <ReviewAvatar name={name} review={review} />
        {metadata}
      </aside>
    );
  }

  return (
    <div class="atv-review-top">
      <ReviewAvatar name={name} review={review} />
      {metadata}
    </div>
  );
};

const ReviewActions = ({
  canVote,
  onAuthenticationRequired,
  onVote,
  onVoteStateChange,
  review,
  voteState,
}: Omit<ReviewCardProps, "layout" | "onOpen" | "reply">) => (
  <div class="atv-review-actions">
    <ReviewVoteButtons
      {...(canVote ? { canVote } : {})}
      {...(onAuthenticationRequired ? { onAuthenticationRequired } : {})}
      {...(onVote ? { onVote } : {})}
      {...(onVoteStateChange ? { onStateChange: onVoteStateChange } : {})}
      review={review}
      {...(voteState ? { state: voteState } : {})}
    />
  </div>
);

const CompactReviewCard = ({
  canVote,
  onAuthenticationRequired,
  onOpen,
  onVote,
  onVoteStateChange,
  review,
  voteState,
}: Omit<ReviewCardProps, "layout" | "reply">) => (
  <article class="atv-review-card is-compact" data-rid={review.id || undefined}>
    <button
      aria-label={`展开阅读：${review.title}`}
      class="atv-review-open-button"
      onClick={() => onOpen(review)}
      type="button"
    />
    <div class="atv-review-content">
      <ReviewIdentity review={review} />
      <div class="atv-review-title">{review.title}</div>
      {review.spoiler ? <SpoilerNote compact /> : null}
      <div class="atv-review-excerpt">{review.content}</div>
      <div class="atv-review-foot">
        <span class="atv-review-time">{review.time || ""}</span>
        <span class="atv-review-readmore">展开阅读</span>
        <ReviewActions
          {...(canVote ? { canVote } : {})}
          {...(onAuthenticationRequired ? { onAuthenticationRequired } : {})}
          {...(onVote ? { onVote } : {})}
          {...(onVoteStateChange ? { onVoteStateChange } : {})}
          review={review}
          {...(voteState ? { voteState } : {})}
        />
      </div>
    </div>
  </article>
);

const DirectoryReviewCard = ({
  canVote,
  onAuthenticationRequired,
  onOpen,
  onVote,
  onVoteStateChange,
  reply,
  review,
  voteState,
}: Omit<ReviewCardProps, "layout">) => (
  <article
    class="atv-review-card is-directory"
    data-rid={review.id || undefined}
  >
    <button
      aria-label={`展开阅读：${review.title}`}
      class="atv-review-open-button"
      onClick={() => onOpen(review)}
      type="button"
    />
    <ReviewIdentity directory review={review} />
    <div class="atv-review-directory-reading">
      <div class="atv-review-title">{review.title}</div>
      {review.spoiler ? <SpoilerNote compact /> : null}
      <div class="atv-review-excerpt">{review.content}</div>
      <div class="atv-review-foot">
        <span class="atv-review-readmore">展开阅读</span>
        {reply ? (
          <a
            class="atv-review-reply"
            href={reply.href}
            onClick={(event) => event.stopPropagation()}
            rel="noopener"
            target="_blank"
          >
            {reply.label}
          </a>
        ) : null}
        <ReviewActions
          {...(canVote ? { canVote } : {})}
          {...(onAuthenticationRequired ? { onAuthenticationRequired } : {})}
          {...(onVote ? { onVote } : {})}
          {...(onVoteStateChange ? { onVoteStateChange } : {})}
          review={review}
          {...(voteState ? { voteState } : {})}
        />
      </div>
    </div>
  </article>
);

const ReviewCard = ({ layout = "compact", ...props }: ReviewCardProps) =>
  layout === "directory" ? (
    <DirectoryReviewCard {...props} />
  ) : (
    <CompactReviewCard {...props} />
  );

export { ReviewCard };
export type { ReviewCardProps };
