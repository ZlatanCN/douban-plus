import { ReviewCard } from "@/domains/review-reader";
import type {
  Review,
  ReviewVoteCallback,
  ReviewVoteDirection,
  ReviewVoteState,
} from "@/domains/review-reader";
import type { VotePersistOptions } from "@/shared/voting/vote-state";

import { PaginationNav } from "./pagination";
import type { PaginationNavProps } from "./pagination";

type ReviewStreamProps = {
  readerReviews: Review[];
  replies: ({ href: string; label: string } | null)[];
  locked: boolean;
  pendingLabel: string | null;
  failure: boolean;
  onRetry: () => void;
  onDismissFailure: () => void;
  loggedIn: boolean;
  onVote: ReviewVoteCallback;
  onAuthenticationRequired: (
    review: Review,
    direction: ReviewVoteDirection
  ) => void;
  onOpen: (review: Review) => void;
  onVoteStateChange: (
    review: Review,
    state: ReviewVoteState,
    options?: VotePersistOptions
  ) => void;
  paginationNav: PaginationNavProps["nav"];
  subjectId: string;
  reviewKind: string;
  onNavigate: (href: string, label: string) => void;
  onNavigateAll: (event: MouseEvent, href: string) => void;
  mergeVoteState: (review: Review) => Review;
  getVoteState: (review: Review) => ReviewVoteState;
};

const ReviewStream = ({
  readerReviews,
  replies,
  locked,
  pendingLabel,
  failure,
  onRetry,
  onDismissFailure,
  loggedIn,
  onVote,
  onAuthenticationRequired,
  onOpen,
  onVoteStateChange,
  paginationNav,
  subjectId,
  reviewKind,
  onNavigate,
  onNavigateAll,
  mergeVoteState,
  getVoteState,
}: ReviewStreamProps) => (
  <section
    aria-busy={locked}
    aria-label={`${reviewKind}目录`}
    class={`atv-subject-reviews-stream${locked ? " is-loading" : ""}`}
  >
    <p aria-live="polite" class="atv-subject-reviews-live">
      {pendingLabel}
    </p>
    {failure ? (
      <output class="atv-subject-reviews-failure">
        <span>影评暂未更新，当前结果仍可继续阅读。</span>
        <button onClick={onRetry} type="button">
          重试
        </button>
        <button onClick={onDismissFailure} type="button">
          关闭
        </button>
      </output>
    ) : null}
    <div class="atv-subject-reviews-results">
      {readerReviews.length ? (
        readerReviews.map((review, index) => (
          <ReviewCard
            canVote={() => loggedIn}
            key={review.id}
            layout="directory"
            onAuthenticationRequired={onAuthenticationRequired}
            onOpen={onOpen}
            onVote={onVote}
            onVoteStateChange={onVoteStateChange}
            reply={replies[index]}
            review={mergeVoteState(review)}
            voteState={getVoteState(review)}
          />
        ))
      ) : (
        <div class="atv-subject-reviews-empty">
          <p>这个筛选下暂时没有{reviewKind}。</p>
          <a
            aria-disabled={locked ? "true" : undefined}
            href={`https://movie.douban.com/subject/${subjectId}/reviews`}
            onClick={(event) => onNavigateAll(event, event.currentTarget.href)}
          >
            查看全部{reviewKind}
          </a>
        </div>
      )}
    </div>
    <PaginationNav
      nav={paginationNav}
      locked={locked}
      onNavigate={onNavigate}
    />
  </section>
);

export { ReviewStream };
