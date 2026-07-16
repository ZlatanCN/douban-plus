import { useState } from "preact/hooks";

import { StickyNav } from "@/components/layout";
import { ModalSession, PosterModal, TrailerModal } from "@/components/modal";
import type { Comment, DoubanData, HeroData, Review, Trailer } from "@/types";

import { CommentsSection } from "./comments";
import { CommentModal } from "./comments/comment-modal";
import { commentVoteApi } from "./comments/comment-vote-state";
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
import { reviewVoteApi } from "./reviews/review-vote-state";
import { SubjectSwitcher } from "./search/subject-switcher";
import type { SubjectPageRuntime } from "./types";
import { useModalRequest } from "./use-modal-request";
import { useVoteState } from "./use-vote-state";

type SubjectPageProps = {
  data: DoubanData;
  runtime: SubjectPageRuntime;
};

type ActiveMediaModal =
  | { alt: string; src: string; type: "poster" }
  | { trailer: Trailer; type: "video" };

const toHeroData = (data: DoubanData, summary: string | null): HeroData => ({
  imdbId: data.info.imdb || null,
  info: data.info,
  interest: data.interest,
  isTV: data.isTV,
  photos: data.photos,
  poster: data.poster,
  rankLabel: data.rankLabel,
  rating: data.rating,
  subjectId: data.subjectId,
  summary,
  title: data.title,
  year: data.year,
});

const SubjectPage = ({ data, runtime }: SubjectPageProps) => {
  const activeComment = useModalRequest<Comment>();
  const activeReview = useModalRequest<Review>();
  const activeMediaModal = useModalRequest<ActiveMediaModal>();
  const [subjectSwitcherOpen, setSubjectSwitcherOpen] = useState(false);
  const loginAction = useModalRequest<string>();
  const commentVotes = useVoteState(data.comments, commentVoteApi);
  const activeResolvedComment = activeComment.active
    ? (runtime.resolvedComments.find(
        (comment) => comment.cid === activeComment.active?.value.cid
      ) ?? activeComment.active.value)
    : null;
  const reviewVotes = useVoteState(data.reviews, reviewVoteApi);
  const handleCommentVoteStateChange = commentVotes.setVoteState;
  const handleReviewVoteStateChange = reviewVotes.setVoteState;
  const interestMarking = useInterestMarking({
    adapters: runtime.actions.interestMarking,
    loggedIn: data.interest.loggedIn,
    onLoginRequired: loginAction.handleOpen,
    subjectId: data.subjectId,
  });
  const canVote = (): boolean => {
    if (!data.interest.loggedIn) {
      loginAction.handleOpen("给短评点有用");
      return false;
    }
    return true;
  };
  const canReviewVote = (): boolean => {
    if (!data.interest.loggedIn) {
      loginAction.handleOpen("给影评投票");
      return false;
    }
    return true;
  };

  return (
    <>
      <StickyNav
        {...runtime.navigation}
        subjectSwitcher={
          <SubjectSwitcher onOpenChange={setSubjectSwitcherOpen} />
        }
        subjectSwitcherOpen={subjectSwitcherOpen}
        title={data.title}
      />
      <Hero
        callbacks={interestMarking.callbacks}
        data={toHeroData(data, runtime.summary)}
        externalRatings={runtime.externalRatings}
        firstBroadcastPlatform={runtime.firstBroadcastPlatform}
        onOpenPoster={(src, alt) =>
          activeMediaModal.handleOpen({ alt, src, type: "poster" })
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
          activeMediaModal.handleOpen({ alt, src, type: "poster" })
        }
        onOpenVideo={(trailer) =>
          activeMediaModal.handleOpen({ trailer, type: "video" })
        }
      />
      <CommentsSection
        canVote={canVote}
        comments={commentVotes.mergeVoteStates(runtime.resolvedComments)}
        getVoteState={commentVotes.getVoteState}
        onOpen={activeComment.handleOpen}
        onVoteStateChange={handleCommentVoteStateChange}
        onVote={runtime.actions.handleCommentVote}
        subjectId={data.subjectId}
      />
      <ReviewsSection
        canVote={canReviewVote}
        getVoteState={reviewVotes.getVoteState}
        isTV={data.isTV}
        onOpen={activeReview.handleOpen}
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
      {activeComment.active && activeResolvedComment ? (
        <ModalSession request={activeComment.active}>
          <CommentModal
            canVote={canVote}
            comment={commentVotes.mergeVoteState(activeResolvedComment)}
            onClose={activeComment.handleClose}
            onVoteStateChange={handleCommentVoteStateChange}
            onVote={runtime.actions.handleCommentVote}
            voteState={commentVotes.getVoteState(activeResolvedComment)}
          />
        </ModalSession>
      ) : null}
      {activeReview.active ? (
        <ModalSession request={activeReview.active}>
          <ReviewModal
            canVote={canReviewVote}
            onClose={activeReview.handleClose}
            onVoteStateChange={handleReviewVoteStateChange}
            onVote={runtime.actions.handleReviewVote}
            review={reviewVotes.mergeVoteState(activeReview.active.value)}
            voteState={reviewVotes.getVoteState(activeReview.active.value)}
          />
        </ModalSession>
      ) : null}
      {activeMediaModal.active?.value.type === "poster" ? (
        <ModalSession request={activeMediaModal.active}>
          <PosterModal
            alt={activeMediaModal.active.value.alt}
            onClose={activeMediaModal.handleClose}
            src={activeMediaModal.active.value.src}
          />
        </ModalSession>
      ) : null}
      {activeMediaModal.active?.value.type === "video" ? (
        <ModalSession request={activeMediaModal.active}>
          <TrailerModal
            onClose={activeMediaModal.handleClose}
            trailer={activeMediaModal.active.value.trailer}
          />
        </ModalSession>
      ) : null}
      {loginAction.active ? (
        <ModalSession request={loginAction.active}>
          <LoginModal
            action={loginAction.active.value}
            onClose={loginAction.handleClose}
          />
        </ModalSession>
      ) : null}
      {interestMarking.form}
    </>
  );
};

export { SubjectPage, toHeroData };
export type { SubjectPageProps };
