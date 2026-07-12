import { useState } from "preact/hooks";

import { StickyNav } from "@/components/layout";
import { PosterModal, VideoModal } from "@/components/modal";
import type { Comment, DoubanData, HeroData, Review, Trailer } from "@/types";

import { CommentsSection } from "./comments";
import { CommentModal } from "./comments/comment-modal";
import {
  commentVoteKey,
  commentWithVoteState,
  initialCommentVoteState,
} from "./comments/comment-vote-state";
import type { CommentVoteState } from "./comments/comment-vote-state";
import { useAvatarUrls } from "./comments/use-avatar-urls";
import { DetailsSection } from "./details";
import { DiscussionsSection } from "./discussions";
import { Hero } from "./hero";
import { useInterestMarking } from "./interest/use-interest-marking";
import { LoginModal } from "./login/login-modal";
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
import type { SubjectPageRuntime } from "./types";
import { useVoteState } from "./use-vote-state";
import type { VoteStateStrategy } from "./use-vote-state";

type SubjectPageProps = {
  data: DoubanData;
  runtime: SubjectPageRuntime;
};

type ActiveMediaModal =
  | { alt: string; src: string; type: "poster" }
  | { trailer: Trailer; type: "video" }
  | null;

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

const SubjectPage = ({ data, runtime }: SubjectPageProps) => {
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [activeMediaModal, setActiveMediaModal] =
    useState<ActiveMediaModal>(null);
  const [loginAction, setLoginAction] = useState<string | null>(null);
  const commentVotes = useVoteState(data.comments, commentVoteStrategy);
  const avatarUrls = useAvatarUrls(data.comments);
  const reviewVotes = useVoteState(data.reviews, reviewVoteStrategy);
  const handleCommentVoteStateChange = commentVotes.setVoteState;
  const handleReviewVoteStateChange = reviewVotes.setVoteState;
  const interestMarking = useInterestMarking({
    adapters: runtime.actions.interestMarking,
    loggedIn: data.interest.loggedIn,
    onLoginRequired: setLoginAction,
    subjectId: data.subjectId,
  });
  const canVote = (): boolean => {
    if (!data.interest.loggedIn) {
      setLoginAction("给短评点有用");
      return false;
    }
    return true;
  };
  const canReviewVote = (): boolean => {
    if (!data.interest.loggedIn) {
      setLoginAction("给影评投票");
      return false;
    }
    return true;
  };

  return (
    <>
      <StickyNav {...runtime.navigation} title={data.title} />
      <Hero
        callbacks={interestMarking.callbacks}
        data={toHeroData(data)}
        expandNativeSummary={runtime.actions.expandNativeSummary}
        externalRatings={runtime.externalRatings}
        firstBroadcastPlatform={runtime.firstBroadcastPlatform}
        onOpenPoster={(src, alt) =>
          setActiveMediaModal({ alt, src, type: "poster" })
        }
      />
      <StreamingSection streaming={data.streaming} />
      <SeriesSection items={runtime.series} moreLink={runtime.seriesMoreLink} />
      <CastSection celebrities={data.celebrities} />
      <PhotosSection
        data={{
          photos: data.photos,
          subjectId: data.subjectId,
          trailers: data.trailers,
        }}
        onOpenPoster={(src, alt) =>
          setActiveMediaModal({ alt, src, type: "poster" })
        }
        onOpenVideo={(trailer) =>
          setActiveMediaModal({ trailer, type: "video" })
        }
      />
      <CommentsSection
        avatarUrls={avatarUrls}
        canVote={canVote}
        comments={commentVotes.mergeVoteStates(data.comments)}
        getVoteState={commentVotes.getVoteState}
        onOpen={setActiveComment}
        onVoteStateChange={handleCommentVoteStateChange}
        onVote={runtime.actions.handleCommentVote}
        subjectId={data.subjectId}
      />
      <ReviewsSection
        canVote={canReviewVote}
        getVoteState={reviewVotes.getVoteState}
        isTV={data.isTV}
        onOpen={setActiveReview}
        onVoteStateChange={handleReviewVoteStateChange}
        onVote={runtime.actions.handleReviewVote}
        reviews={reviewVotes.mergeVoteStates(data.reviews)}
        subjectId={data.subjectId}
      />
      <DiscussionsSection discussions={data.discussions} />
      <RecommendationsSection recommendations={data.recommendations} />
      <DetailsSection
        data={{ awards: data.awards, info: data.info, isTV: data.isTV }}
      />
      <div class="atv-footer-spacer" />

      {/* Modals rendered outside sections to avoid ancestor transform containment */}
      {activeComment ? (
        <CommentModal
          canVote={canVote}
          comment={{
            ...commentVotes.mergeVoteState(activeComment),
            avatar: avatarUrls.get(activeComment.link) || activeComment.avatar,
          }}
          onClose={() => setActiveComment(null)}
          onVoteStateChange={handleCommentVoteStateChange}
          onVote={runtime.actions.handleCommentVote}
          voteState={commentVotes.getVoteState(activeComment)}
        />
      ) : null}
      {activeReview ? (
        <ReviewModal
          canVote={canReviewVote}
          onClose={() => setActiveReview(null)}
          onVoteStateChange={handleReviewVoteStateChange}
          onVote={runtime.actions.handleReviewVote}
          review={reviewVotes.mergeVoteState(activeReview)}
          voteState={reviewVotes.getVoteState(activeReview)}
        />
      ) : null}
      {activeMediaModal?.type === "poster" ? (
        <PosterModal
          alt={activeMediaModal.alt}
          onClose={() => setActiveMediaModal(null)}
          src={activeMediaModal.src}
        />
      ) : null}
      {activeMediaModal?.type === "video" ? (
        <VideoModal
          onClose={() => setActiveMediaModal(null)}
          trailer={activeMediaModal.trailer}
        />
      ) : null}
      {loginAction ? (
        <LoginModal action={loginAction} onClose={() => setLoginAction(null)} />
      ) : null}
      {interestMarking.form}
    </>
  );
};

export { SubjectPage, toHeroData };
export type { SubjectPageProps };
