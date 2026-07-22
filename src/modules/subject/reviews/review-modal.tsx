import { useEffect, useRef } from "preact/hooks";

import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "@/modules/subject/domain";
import type { ReviewContentState } from "@/modules/subject/runtime/use-review-content";
import { HtmlContent } from "@/shared/components/common/html-content";
import { Stars } from "@/shared/components/common/stars";
import { ModalCloseButton, ModalShell } from "@/shared/components/modal";
import { useModalClose } from "@/shared/components/modal/modal-close-context";
import { playEntrance, springConfigs } from "@/shared/utils/springs";

import { reviewDisplayName, reviewNumericId } from "./review-identity";
import { ReviewVoteButtons } from "./review-vote-buttons";
import type { ReviewVoteState } from "./review-vote-state";

type ReviewModalProps = {
  canVote?: AccountActionGuard;
  content: ReviewContentState;
  onClose: () => void;
  onVoteStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: { persist?: boolean }
  ) => void;
  onVote?: ReviewVoteCallback;
  review: Review;
  voteState?: ReviewVoteState;
};

const bodyClassName = (status: ReviewContentState["status"]) => {
  if (status === "loaded") {
    return "atv-review-modal-body is-loaded";
  }
  if (status === "error") {
    return "atv-review-modal-body is-error";
  }
  return "atv-review-modal-body is-skeleton";
};

const ReviewModalContent = ({
  canVote,
  content,
  onVoteStateChange,
  onVote,
  review,
  voteState,
}: {
  canVote?: AccountActionGuard;
  content: ReviewContentState;
  onVoteStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: { persist?: boolean }
  ) => void;
  onVote?: ReviewVoteCallback;
  review: Review;
  voteState?: ReviewVoteState;
}) => {
  const handleClose = useModalClose();
  const displayName = reviewDisplayName(review.name);
  const numericId = reviewNumericId(review.id);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodyAnimationRef = useRef<{ stop: () => void } | null>(null);
  const prevStatusRef = useRef<ReviewContentState["status"]>("loading");

  useEffect(() => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) {
      return;
    }
    const currentStatus = content.status;
    const justFinished =
      (currentStatus === "loaded" || currentStatus === "error") &&
      prevStatusRef.current === "loading";
    prevStatusRef.current = currentStatus;

    if (justFinished) {
      bodyAnimationRef.current?.stop();
      bodyAnimationRef.current = playEntrance(
        bodyEl,
        springConfigs.reviewBodyEntrance
      );
    }
  }, [content.status]);
  return (
    <>
      <ModalCloseButton ariaLabel="关闭影评" onClick={handleClose} />
      <div class="atv-modal-accent-bar" />
      <div class="atv-review-modal-header">
        <div
          class="atv-review-modal-title"
          id="atv-review-modal-title"
          tabindex={-1}
        >
          {review.title}
        </div>
        {review.stars > 0 ? (
          <Stars
            className="atv-review-modal-stars"
            outOfFive
            score={review.stars}
          />
        ) : null}
        <div class="atv-review-modal-byline">
          <div
            class="atv-review-modal-avatar"
            style={
              review.avatar
                ? { backgroundImage: `url("${review.avatar}")` }
                : undefined
            }
          >
            {review.avatar ? null : displayName.slice(0, 1).toUpperCase()}
          </div>
          <div class="atv-review-modal-byline-text">
            <span class="atv-review-modal-byline-name">{displayName}</span>
            {review.time ? (
              <span class="atv-review-modal-byline-time">· {review.time}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div ref={bodyRef}>
        <HtmlContent
          aria-busy={content.status === "loading" ? "true" : "false"}
          aria-live="polite"
          class={bodyClassName(content.status)}
          {...(content.html ? { html: content.html } : {})}
        >
          {content.status === "loading" ? "加载中" : null}
          {content.status === "error" ? (
            <div class="atv-review-modal-error">
              <p>影评内容暂时加载失败</p>
            </div>
          ) : null}
        </HtmlContent>
      </div>
      <div class="atv-review-modal-footer">
        <div class="atv-review-modal-votes">
          <div class="atv-review-actions" data-rid={review.id || undefined}>
            <ReviewVoteButtons
              {...(canVote ? { canVote } : {})}
              {...(onVoteStateChange
                ? { onStateChange: onVoteStateChange }
                : {})}
              {...(onVote ? { onVote } : {})}
              review={review}
              size="large"
              {...(voteState ? { state: voteState } : {})}
            />
          </div>
        </div>
        <div class="atv-review-modal-link">
          <a
            class="atv-review-modal-link-a"
            href={`https://movie.douban.com/review/${numericId}/`}
            rel="noopener"
            target="_blank"
          >
            查看豆瓣原文 →
          </a>
        </div>
      </div>
    </>
  );
};

const ReviewModal = ({
  canVote,
  content,
  onClose,
  onVoteStateChange,
  onVote,
  review,
  voteState,
}: ReviewModalProps) => (
  <ModalShell
    ariaLabelledBy="atv-review-modal-title"
    className="atv-review-modal"
    id="atv-review-modal"
    onClose={onClose}
    surfaceClassName="atv-review-modal-scroll"
  >
    <ReviewModalContent
      {...(canVote ? { canVote } : {})}
      content={content}
      {...(onVote ? { onVote } : {})}
      {...(onVoteStateChange ? { onVoteStateChange } : {})}
      review={review}
      {...(voteState ? { voteState } : {})}
    />
  </ModalShell>
);

export { ReviewModal };
export type { ReviewModalProps };
