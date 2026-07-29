import { useCallback, useEffect, useState } from "preact/hooks";

import {
  ReviewContentModal,
  reviewVoteApi,
  resumeReviewVote,
} from "@/domains/review-reader";
import type { ReviewVoteDirection } from "@/domains/review-reader";
import type {
  Comment,
  DoubanData,
  HeroData,
  Review,
  Trailer,
} from "@/modules/subject/domain";
import { useInterestMarking } from "@/shared/components/interest-form";
import { extractInterestState } from "@/shared/components/interest-form/extract-douban-interest";
import { LoginModal } from "@/shared/components/login-modal";
import { ModalSession, PosterModal } from "@/shared/components/modal";
import type { ImageModalSource } from "@/shared/components/modal";
import { useModalRequest } from "@/shared/hooks/use-modal-request";

import { CommentsSection } from "../comments";
import { CommentModal } from "../comments/comment-modal";
import { commentVoteApi } from "../comments/comment-vote-state";
import { DetailsSection } from "../details";
import { DiscussionsSection } from "../discussions";
import { Hero } from "../hero";
import {
  CastSection,
  PhotosSection,
  RecommendationsSection,
  SeriesSection,
  StreamingSection,
  TrailerModal,
} from "../media";
import { SubjectStickyNav } from "../navigation/sticky-nav";
import { ReviewsSection } from "../reviews";
import { SubjectSwitcher } from "../search/subject-switcher";
import { useVoteState } from "../voting/use-vote-state";
import type { SubjectPageRuntime } from "./types";

type SubjectPageProps = {
  data: DoubanData;
  onAuthenticated?: () => Promise<DoubanData>;
  runtime: SubjectPageRuntime;
};

type ActiveMediaModal =
  | { image: ImageModalSource; type: "poster" }
  | { trailer: Trailer; type: "video" };

type LoginRequest = {
  action: string;
  onAuthenticated?: (interest: DoubanData["interest"]) => void;
};

const toHeroData = (
  data: DoubanData,
  summary: string | null,
  interest = data.interest
): HeroData => ({
  imdbId: data.info.imdb || null,
  info: data.info,
  interest,
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

const SubjectPage = ({ data, onAuthenticated, runtime }: SubjectPageProps) => {
  const [interest, setInterest] = useState(data.interest);
  useEffect(() => {
    setInterest(data.interest);
  }, [data.interest]);
  const activeComment = useModalRequest<Comment>();
  const activeReview = useModalRequest<Review>();
  const activeMediaModal = useModalRequest<ActiveMediaModal>();

  const loginAction = useModalRequest<LoginRequest>();
  const {
    active: activeLogin,
    handleClose: handleCloseLogin,
    handleOpen: handleOpenLogin,
  } = loginAction;
  const requestLogin = useCallback(
    (
      action: string,
      resumeAfterAuthentication?: (interest: DoubanData["interest"]) => void
    ): void => {
      handleOpenLogin({
        action,
        ...(resumeAfterAuthentication
          ? { onAuthenticated: resumeAfterAuthentication }
          : {}),
      });
    },
    [handleOpenLogin]
  );
  const handleLoginAuthenticated = useCallback(async (): Promise<void> => {
    let refreshedInterest: DoubanData["interest"];
    try {
      const refreshedData = onAuthenticated ? await onAuthenticated() : null;
      refreshedInterest =
        refreshedData?.interest ??
        (await runtime.actions.interestMarking.read(data.subjectId));
    } catch {
      try {
        refreshedInterest = await runtime.actions.interestMarking.read(
          data.subjectId
        );
      } catch {
        refreshedInterest = extractInterestState(document);
      }
    }
    setInterest(refreshedInterest);
    activeLogin?.value.onAuthenticated?.(refreshedInterest);
    handleCloseLogin();
  }, [
    activeLogin,
    data.subjectId,
    handleCloseLogin,
    onAuthenticated,
    runtime.actions.interestMarking,
  ]);
  const commentVotes = useVoteState(data.comments, commentVoteApi);
  const activeResolvedComment = activeComment.active
    ? (runtime.resolvedComments.find(
        (comment) => comment.cid === activeComment.active?.value.cid
      ) ?? activeComment.active.value)
    : null;
  const reviewVotes = useVoteState(data.reviews, reviewVoteApi);
  const handleCommentVoteStateChange = commentVotes.setVoteState;
  const handleReviewVoteStateChange = reviewVotes.setVoteState;
  const activeResolvedReview = activeReview.active
    ? (data.reviews.find(
        (review) => review.id === activeReview.active?.value.id
      ) ?? activeReview.active.value)
    : null;
  const interestMarking = useInterestMarking({
    adapters: runtime.actions.interestMarking,
    loggedIn: interest.loggedIn,
    onInterestChange: setInterest,
    onLoginRequired: requestLogin,
    subjectId: data.subjectId,
    subjectTitle: data.title.primary,
  });
  const canVote = (): boolean => {
    if (!interest.loggedIn) {
      requestLogin("给短评点有用");
      return false;
    }
    return true;
  };
  const canReviewVote = (): boolean => interest.loggedIn;
  const requestReviewVoteAuthentication = useCallback(
    (review: Review, direction: ReviewVoteDirection): void => {
      requestLogin("给影评投票", () => {
        void (async (): Promise<void> => {
          await resumeReviewVote(
            review,
            direction,
            runtime.actions.handleReviewVote,
            reviewVotes
          );
        })();
      });
    },
    [requestLogin, reviewVotes, runtime.actions]
  );

  return (
    <>
      <SubjectStickyNav
        {...runtime.navigation}
        subjectSwitcher={<SubjectSwitcher />}
        title={data.title}
      />
      <Hero
        callbacks={interestMarking.callbacks}
        data={toHeroData(data, runtime.summary, interest)}
        externalRatings={runtime.externalRatings}
        firstBroadcastPlatform={runtime.firstBroadcastPlatform}
        onOpenPoster={(src, alt) =>
          activeMediaModal.handleOpen({
            image: { alt, src },
            type: "poster",
          })
        }
      />
      <StreamingSection streaming={data.streaming} />
      <SeriesSection
        items={runtime.series}
        {...(runtime.seriesMoreLink
          ? { moreLink: runtime.seriesMoreLink }
          : {})}
      />
      <CastSection celebrities={data.celebrities} subjectId={data.subjectId} />
      <PhotosSection
        data={{
          photos: runtime.photoResolution.photos,
          subjectId: data.subjectId,
          trailers: data.trailers,
        }}
        onOpenImage={(image) =>
          activeMediaModal.handleOpen({ image, type: "poster" })
        }
        onOpenVideo={(trailer) =>
          activeMediaModal.handleOpen({ trailer, type: "video" })
        }
        resolvingPhotos={runtime.photoResolution.status === "loading"}
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
        onAuthenticationRequired={requestReviewVoteAuthentication}
        onOpen={activeReview.handleOpen}
        onVote={runtime.actions.handleReviewVote}
        onVoteStateChange={handleReviewVoteStateChange}
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
      {activeReview.active && activeResolvedReview ? (
        <ModalSession request={activeReview.active}>
          <ReviewContentModal
            canVote={canReviewVote}
            onClose={activeReview.handleClose}
            onAuthenticationRequired={requestReviewVoteAuthentication}
            onVoteStateChange={handleReviewVoteStateChange}
            onVote={runtime.actions.handleReviewVote}
            review={reviewVotes.mergeVoteState(activeResolvedReview)}
            voteState={reviewVotes.getVoteState(activeResolvedReview)}
          />
        </ModalSession>
      ) : null}
      {activeMediaModal.active?.value.type === "poster" ? (
        <ModalSession request={activeMediaModal.active}>
          <PosterModal
            alt={activeMediaModal.active.value.image.alt}
            onClose={activeMediaModal.handleClose}
            {...(activeMediaModal.active.value.image.previewSrc
              ? { previewSrc: activeMediaModal.active.value.image.previewSrc }
              : {})}
            src={activeMediaModal.active.value.image.src}
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
      {activeLogin ? (
        <ModalSession request={activeLogin}>
          <LoginModal
            action={activeLogin.value.action}
            onAuthenticated={handleLoginAuthenticated}
            onClose={handleCloseLogin}
          />
        </ModalSession>
      ) : null}
      {interestMarking.form}
    </>
  );
};

export { SubjectPage, toHeroData };
export type { SubjectPageProps };
