import { useEffect, useRef } from "preact/hooks";

import { HtmlContent } from "@/shared/components/common/html-content";
import { Stars } from "@/shared/components/common/stars";
import { ModalCloseButton, ModalShell } from "@/shared/components/modal";
import { useModalClose } from "@/shared/components/modal/modal-close-context";
import { playEntrance, springConfigs } from "@/shared/utils/springs";
import type { VotePersistOptions } from "@/shared/voting/vote-state";

import type { AccountActionGuard, Review, ReviewVoteCallback } from "./domain";
import { reviewDisplayName, reviewNumericId } from "./review-identity";
import { ReviewVoteButtons } from "./review-vote-buttons";
import type { ReviewVoteDirection, ReviewVoteState } from "./review-vote-state";
import { SpoilerNote } from "./spoiler-note";
import type { ReviewContentState } from "./use-review-content";

type ReviewModalProps = {
  canVote?: AccountActionGuard;
  content: ReviewContentState;
  onAuthenticationRequired?: (
    review: Review,
    direction: ReviewVoteDirection
  ) => void;
  onClose: () => void;
  onVote?: ReviewVoteCallback;
  onVoteStateChange?: (
    review: Review,
    state: ReviewVoteState,
    options?: VotePersistOptions
  ) => void;
  review: Review;
  voteState?: ReviewVoteState;
};
const ReviewModalContent = ({
  canVote,
  content,
  onAuthenticationRequired,
  onVote,
  onVoteStateChange,
  review,
  voteState,
}: Omit<ReviewModalProps, "onClose">) => {
  const close = useModalClose();
  const body = useRef<HTMLDivElement>(null);
  const name = reviewDisplayName(review.name);
  useEffect(() => {
    if (content.status !== "loading" && body.current) {
      playEntrance(body.current, springConfigs.reviewBodyEntrance);
    }
  }, [content.status]);
  return (
    <>
      <ModalCloseButton ariaLabel="关闭影评" onClick={close} />
      <div class="atv-review-modal-header">
        <div class="atv-review-modal-header-primary">
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
        </div>
        <div class="atv-review-modal-header-meta">
          <div class="atv-review-modal-byline">
            <div
              class="atv-review-modal-avatar"
              style={
                review.avatar
                  ? { backgroundImage: `url("${review.avatar}")` }
                  : undefined
              }
            >
              {review.avatar ? null : name.slice(0, 1).toUpperCase()}
            </div>
            <div class="atv-review-modal-byline-text">
              <span class="atv-review-modal-byline-name">{name}</span>
              {review.time ? (
                <span class="atv-review-modal-byline-time">
                  · {review.time}
                </span>
              ) : null}
            </div>
          </div>
          {review.spoiler ? <SpoilerNote compact /> : null}
        </div>
      </div>
      <div ref={body}>
        <HtmlContent
          aria-busy={content.status === "loading" ? "true" : "false"}
          aria-live="polite"
          class={`atv-review-modal-body is-${content.status}`}
          {...(content.html ? { html: content.html } : {})}
        >
          {content.status === "loading" ? "加载中" : null}
          {content.status === "error" ? (
            <div class="atv-review-modal-error">
              <p>影评内容暂时加载失败</p>
              <a
                href={`https://movie.douban.com/review/${reviewNumericId(review.id)}/`}
                rel="noopener"
                target="_blank"
              >
                在豆瓣原文中打开
              </a>
            </div>
          ) : null}
        </HtmlContent>
      </div>
      <div class="atv-review-modal-footer">
        <div class="atv-review-modal-votes">
          <div class="atv-review-actions">
            <ReviewVoteButtons
              {...(canVote ? { canVote } : {})}
              {...(onAuthenticationRequired
                ? { onAuthenticationRequired }
                : {})}
              {...(onVote ? { onVote } : {})}
              {...(onVoteStateChange
                ? { onStateChange: onVoteStateChange }
                : {})}
              review={review}
              size="large"
              {...(voteState ? { state: voteState } : {})}
            />
          </div>
        </div>
        <a
          class="atv-review-modal-link-a"
          href={`https://movie.douban.com/review/${reviewNumericId(review.id)}/`}
          rel="noopener"
          target="_blank"
        >
          查看豆瓣原文 →
        </a>
      </div>
    </>
  );
};
const ReviewModal = ({ onClose, ...props }: ReviewModalProps) => (
  <ModalShell
    ariaLabelledBy="atv-review-modal-title"
    className="atv-review-modal"
    id="atv-review-modal"
    onClose={onClose}
    surfaceClassName="atv-review-modal-scroll"
  >
    <ReviewModalContent {...props} />
  </ModalShell>
);
export { ReviewModal };
export type { ReviewModalProps };
