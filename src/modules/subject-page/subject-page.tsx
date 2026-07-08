import { useState } from "preact/hooks";

import type { Comment, DoubanData, HeroData, Review } from "../../types";
import { CommentsSection } from "./comments";
import { CommentModal } from "./comments/comment-modal";
import {
  commentVoteKey,
  commentWithVoteState,
  initialCommentVoteState,
} from "./comments/comment-vote-state";
import type { CommentVoteState } from "./comments/comment-vote-state";
import { DetailsSection } from "./details";
import { Hero } from "./hero";
import {
  CastSection,
  PhotosSection,
  RecommendationsSection,
  SeriesSection,
  StreamingSection,
} from "./media";
import { ReviewsSection } from "./reviews";
import { ReviewModal } from "./reviews/review-modal";
import {
  initialReviewVoteState,
  persistReviewVoteState,
  reviewVoteKey,
  reviewWithVoteState,
} from "./reviews/review-vote-state";
import type { ReviewVoteState } from "./reviews/review-vote-state";
import type { SubjectPageDeps } from "./types";

type SubjectPageProps = {
  data: DoubanData;
  deps: SubjectPageDeps;
};

const toHeroData = (data: DoubanData): HeroData => ({
  imdbId: data.info.imdb || null,
  info: data.info,
  interest: data.interest,
  isTV: data.isTV,
  photos: data.photos,
  poster: data.poster,
  rating: data.rating,
  subjectId: data.subjectId,
  summary: data.summary,
  title: data.title,
  year: data.year,
});

const SubjectPage = ({ data, deps }: SubjectPageProps) => {
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [commentVoteStates, setCommentVoteStates] = useState<
    Record<string, CommentVoteState>
  >(() =>
    Object.fromEntries(
      data.comments.map((comment) => [
        commentVoteKey(comment),
        initialCommentVoteState(comment),
      ])
    )
  );
  const [reviewVoteStates, setReviewVoteStates] = useState<
    Record<string, ReviewVoteState>
  >(() =>
    Object.fromEntries(
      data.reviews.map((review) => [
        reviewVoteKey(review),
        initialReviewVoteState(review),
      ])
    )
  );

  const getCommentVoteState = (comment: Comment): CommentVoteState =>
    commentVoteStates[commentVoteKey(comment)] ??
    initialCommentVoteState(comment);

  const setCommentVoteState = (
    comment: Comment,
    state: CommentVoteState
  ): void => {
    setCommentVoteStates((current) => ({
      ...current,
      [commentVoteKey(comment)]: state,
    }));
  };

  const getReviewVoteState = (review: Review): ReviewVoteState =>
    reviewVoteStates[reviewVoteKey(review)] ?? initialReviewVoteState(review);

  const setReviewVoteState = (
    review: Review,
    state: ReviewVoteState,
    options?: { persist?: boolean }
  ): void => {
    setReviewVoteStates((current) => ({
      ...current,
      [reviewVoteKey(review)]: state,
    }));
    if (options?.persist) {
      persistReviewVoteState(review, state);
    }
  };

  return (
    <>
      <Hero callbacks={deps.heroCallbacks} data={toHeroData(data)} />
      <StreamingSection streaming={data.streaming} />
      <SeriesSection items={data.series} moreLink={deps.seriesMoreLink} />
      <CastSection celebrities={data.celebrities} />
      <PhotosSection
        data={{
          photos: data.photos,
          subjectId: data.subjectId,
          trailers: data.trailers,
        }}
      />
      <CommentsSection
        canVote={deps.canVote}
        comments={data.comments.map((comment) =>
          commentWithVoteState(comment, getCommentVoteState(comment))
        )}
        getVoteState={getCommentVoteState}
        onOpen={setActiveComment}
        onVoteStateChange={setCommentVoteState}
        onVote={deps.handleVote}
        subjectId={data.subjectId}
      />
      <ReviewsSection
        canVote={deps.canReviewVote}
        getVoteState={getReviewVoteState}
        isTV={data.isTV}
        onOpen={setActiveReview}
        onVoteStateChange={setReviewVoteState}
        onVote={deps.handleReviewVote}
        reviews={data.reviews.map((review) =>
          reviewWithVoteState(review, getReviewVoteState(review))
        )}
        subjectId={data.subjectId}
      />
      <RecommendationsSection recommendations={data.recommendations} />
      <DetailsSection
        data={{ awards: data.awards, info: data.info, isTV: data.isTV }}
      />
      <div class="atv-footer-spacer" />

      {/* Modals rendered outside sections to avoid ancestor transform containment */}
      {activeComment ? (
        <CommentModal
          canVote={deps.canVote}
          comment={commentWithVoteState(
            activeComment,
            getCommentVoteState(activeComment)
          )}
          onClose={() => setActiveComment(null)}
          onVoteStateChange={setCommentVoteState}
          onVote={deps.handleVote}
          voteState={getCommentVoteState(activeComment)}
        />
      ) : null}
      {activeReview ? (
        <ReviewModal
          canVote={deps.canReviewVote}
          onClose={() => setActiveReview(null)}
          onVoteStateChange={setReviewVoteState}
          onVote={deps.handleReviewVote}
          review={reviewWithVoteState(
            activeReview,
            getReviewVoteState(activeReview)
          )}
          voteState={getReviewVoteState(activeReview)}
        />
      ) : null}
    </>
  );
};

export { SubjectPage, toHeroData };
export type { SubjectPageProps };
