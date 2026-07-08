import { useState } from "preact/hooks";

import type { Comment, DoubanData, HeroData, Review } from "../../types";
import { CommentsSection } from "./comments";
import { CommentModal } from "./comments/comment-modal";
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
import type { SubjectPageDeps } from "./types";

interface SubjectPageProps {
  data: DoubanData;
  deps: SubjectPageDeps;
}

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
        comments={data.comments}
        onOpen={setActiveComment}
        onVote={deps.handleVote}
        subjectId={data.subjectId}
      />
      <ReviewsSection
        canVote={deps.canReviewVote}
        isTV={data.isTV}
        onOpen={setActiveReview}
        onVote={deps.handleReviewVote}
        reviews={data.reviews}
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
          comment={activeComment}
          onClose={() => setActiveComment(null)}
          onVote={deps.handleVote}
        />
      ) : null}
      {activeReview ? (
        <ReviewModal
          canVote={deps.canReviewVote}
          onClose={() => setActiveReview(null)}
          onVote={deps.handleReviewVote}
          review={activeReview}
        />
      ) : null}
    </>
  );
};

export { SubjectPage, toHeroData };
export type { SubjectPageProps };
