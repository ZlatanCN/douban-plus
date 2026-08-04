import { useCallback, useLayoutEffect, useState } from "preact/hooks";

import {
  ReviewContentModal,
  postReviewVote,
  reviewVoteApi,
  resumeReviewVote,
} from "@/domains/review-reader";
import type { Review, ReviewVoteDirection } from "@/domains/review-reader";
import { extractInterestState } from "@/shared/components/interest-form/extract-douban-interest";
import { StickyNav } from "@/shared/components/layout";
import { LoginModal } from "@/shared/components/login-modal";
import { ModalSession } from "@/shared/components/modal";
import { useModalRequest } from "@/shared/hooks/use-modal-request";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";
import { useVoteState } from "@/shared/voting/use-vote-state";

import type { SubjectReviewsBrowseOption } from "../domain";
import type { SubjectReviewsNavigationState } from "../runtime/navigation";
import { ReviewsFilters } from "./filters";
import { ReviewsPageHeader } from "./page-header";
import { getPaginationNav } from "./pagination";
import { ReviewStream } from "./review-stream";

type LoginRequest = {
  action: string;
  continuation?:
    | { direction: ReviewVoteDirection; review: Review }
    | { href: string; kind: "browse" };
};

const reviewFromDirectory = (
  review: SubjectReviewsNavigationState["data"]["reviews"][number]
): Review => ({
  avatar: review.author.avatar ?? "",
  content: review.content,
  id: review.id,
  link: review.author.href ?? "",
  name: review.author.name,
  ratingWord: review.ratingWord,
  spoiler: review.spoiler,
  stars: review.stars,
  time: review.time,
  title: review.title,
  usefulCount: review.usefulCount,
  uselessCount: review.uselessCount,
});

const modifierClick = (event: MouseEvent): boolean =>
  event.defaultPrevented ||
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey;

const SubjectReviewsPage = ({
  doc,
  navigation,
}: {
  doc: Document;
  navigation: SubjectReviewsNavigationState;
}) => {
  const { data } = navigation;
  const sticky = useStickyNavigation(doc, []);
  const [loggedIn, setLoggedIn] = useState(
    () => extractInterestState(doc).loggedIn
  );
  const login = useModalRequest<LoginRequest>();
  const activeReview = useModalRequest<Review>();
  const readerReviews = data.reviews.map(reviewFromDirectory);
  const votes = useVoteState(readerReviews, reviewVoteApi);
  const locked = navigation.pending !== null;
  const requestLogin = useCallback(
    (request: LoginRequest): void => login.handleOpen(request),
    [login]
  );
  const selected = (option: SubjectReviewsBrowseOption): boolean =>
    navigation.pending
      ? navigation.pending.href === option.href
      : option.active;
  const navigate = (
    event: MouseEvent,
    option:
      | SubjectReviewsBrowseOption
      | { href: string | null; label: string; active: boolean }
  ): void => {
    if (modifierClick(event) || !option.href || locked) {
      return;
    }
    event.preventDefault();
    if ("value" in option && !loggedIn && option.value !== "hotest") {
      requestLogin({
        action: option.value === "follow" ? "查看我关注的影评" : "筛选影评",
        continuation: { href: option.href, kind: "browse" },
      });
      return;
    }
    if (!option.active) {
      navigation.navigate(option.href, option.label);
    }
  };
  const voteAfterAuthentication = useCallback(
    (review: Review, direction: ReviewVoteDirection): void =>
      requestLogin({
        action: "给影评投票",
        continuation: { direction, review },
      }),
    [requestLogin]
  );
  const handleAuthenticated = useCallback(async (): Promise<void> => {
    const continuation = login.active?.value.continuation;
    login.handleClose();
    const refreshed = await navigation.refresh();
    const authenticated = refreshed && extractInterestState(doc).loggedIn;
    setLoggedIn(authenticated);
    if (!authenticated) {
      return;
    }
    if (!continuation) {
      return;
    }
    if ("kind" in continuation) {
      navigation.navigate(continuation.href, "筛选影评");
      return;
    }
    await resumeReviewVote(
      continuation.review,
      continuation.direction,
      (rid, direction) => postReviewVote(data.subjectId, rid, direction),
      votes
    );
  }, [data.subjectId, doc, login, navigation, votes]);
  const browse = (
    event: MouseEvent,
    option: SubjectReviewsBrowseOption
  ): void => {
    navigate(event, option);
  };
  const handleRetry = (): void => navigation.retry();
  const handleDismissFailure = (): void => navigation.dismissFailure();
  const handleNavigateAll = (event: MouseEvent, href: string): void => {
    if (modifierClick(event) || locked) {
      return;
    }
    event.preventDefault();
    navigation.navigate(href, "全部");
  };
  useLayoutEffect(() => {
    if (navigation.version > 0) {
      (doc.defaultView ?? window).scrollTo({ behavior: "auto", top: 0 });
    }
  }, [doc, navigation.version]);

  const paginationNav = getPaginationNav(data.pagination, doc);

  return (
    <>
      <a class="atv-skip-link" href="#atv-subject-reviews">
        跳到内容
      </a>
      <StickyNav
        {...sticky}
        className="atv-subject-reviews-nav"
        title={data.title}
      />
      <main class="atv-subject-reviews" id="atv-subject-reviews" tabIndex={-1}>
        <ReviewsPageHeader
          reviewKind={data.reviewKind}
          subjectHref={data.subjectHref}
          title={data.title}
          writeHref={data.writeHref}
        />
        <div class="atv-subject-reviews-layout">
          <ReviewsFilters
            browse={browse}
            locked={locked}
            navigate={navigate}
            ratings={data.ratings}
            reviewKind={data.reviewKind}
            selected={selected}
            sorts={data.sorts}
          />
          <ReviewStream
            failure={navigation.failure !== null}
            getVoteState={votes.getVoteState}
            locked={locked}
            loggedIn={loggedIn}
            mergeVoteState={votes.mergeVoteState}
            onAuthenticationRequired={voteAfterAuthentication}
            onDismissFailure={handleDismissFailure}
            onNavigate={(href, label) => navigation.navigate(href, label)}
            onNavigateAll={handleNavigateAll}
            onOpen={activeReview.handleOpen}
            onRetry={handleRetry}
            onVote={(rid, direction) =>
              postReviewVote(data.subjectId, rid, direction)
            }
            onVoteStateChange={(item, state, options) =>
              votes.setVoteState(item, state, options)
            }
            paginationNav={paginationNav}
            pendingLabel={
              navigation.pending ? `正在加载${navigation.pending.label}` : ""
            }
            readerReviews={readerReviews}
            replies={data.reviews.map((r) => r.reply)}
            reviewKind={data.reviewKind}
            subjectId={data.subjectId}
          />
        </div>
      </main>
      {activeReview.active ? (
        <ModalSession request={activeReview.active}>
          <ReviewContentModal
            canVote={() => loggedIn}
            onAuthenticationRequired={voteAfterAuthentication}
            onClose={activeReview.handleClose}
            onVote={(rid, direction) =>
              postReviewVote(data.subjectId, rid, direction)
            }
            onVoteStateChange={(item, state, options) =>
              votes.setVoteState(item, state, options)
            }
            review={votes.mergeVoteState(activeReview.active.value)}
            voteState={votes.getVoteState(activeReview.active.value)}
          />
        </ModalSession>
      ) : null}
      {login.active ? (
        <ModalSession request={login.active}>
          <LoginModal
            action={login.active.value.action}
            onAuthenticated={handleAuthenticated}
            onClose={login.handleClose}
          />
        </ModalSession>
      ) : null}
    </>
  );
};

export { SubjectReviewsPage };
