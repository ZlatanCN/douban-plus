import { useState } from "preact/hooks";

import type { Comment, DoubanData, HeroData, Review } from "@/types";

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
import { useVoteState } from "./use-vote-state";
import type { VoteStateStrategy } from "./use-vote-state";

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

const commentVoteStrategy = {
  initial: initialCommentVoteState,
  key: commentVoteKey,
  merge: commentWithVoteState,
} satisfies VoteStateStrategy<Comment, CommentVoteState>;

const reviewVoteStrategy = {
  initial: initialReviewVoteState,
  key: reviewVoteKey,
  merge: reviewWithVoteState,
  persist: persistReviewVoteState,
} satisfies VoteStateStrategy<Review, ReviewVoteState>;

const SubjectPage = ({ data, deps }: SubjectPageProps) => {
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const commentVotes = useVoteState(data.comments, commentVoteStrategy);
  const reviewVotes = useVoteState(data.reviews, reviewVoteStrategy);
  const handleCommentVoteStateChange = commentVotes.setVoteState;
  const handleReviewVoteStateChange = reviewVotes.setVoteState;

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
        comments={commentVotes.mergeVoteStates(data.comments)}
        getVoteState={commentVotes.getVoteState}
        onOpen={setActiveComment}
        onVoteStateChange={handleCommentVoteStateChange}
        onVote={deps.handleVote}
        subjectId={data.subjectId}
      />
      <ReviewsSection
        canVote={deps.canReviewVote}
        getVoteState={reviewVotes.getVoteState}
        isTV={data.isTV}
        onOpen={setActiveReview}
        onVoteStateChange={handleReviewVoteStateChange}
        onVote={deps.handleReviewVote}
        reviews={reviewVotes.mergeVoteStates(data.reviews)}
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
          comment={commentVotes.mergeVoteState(activeComment)}
          onClose={() => setActiveComment(null)}
          onVoteStateChange={handleCommentVoteStateChange}
          onVote={deps.handleVote}
          voteState={commentVotes.getVoteState(activeComment)}
        />
      ) : null}
      {activeReview ? (
        <ReviewModal
          canVote={deps.canReviewVote}
          onClose={() => setActiveReview(null)}
          onVoteStateChange={handleReviewVoteStateChange}
          onVote={deps.handleReviewVote}
          review={reviewVotes.mergeVoteState(activeReview)}
          voteState={reviewVotes.getVoteState(activeReview)}
        />
      ) : null}
    </>
  );
};

export { SubjectPage, toHeroData };
export type { SubjectPageProps };
