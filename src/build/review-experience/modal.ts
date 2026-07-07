import { createOverlay, el, renderStars } from "../../components";
import type { Review, ReviewVoteCallback } from "../../types";
import { loadReviewContent, stripUnfold } from "./content-loader";
import { trapReviewModalFocus } from "./focus";
import { reviewDisplayName, reviewNumericId } from "./identity";
import { buildReviewVotePair } from "./vote-pair";

const appendReviewByline = (
  modalHeader: HTMLElement,
  review: Review,
  displayName: string
): void => {
  const byline = el("div", { className: "atv-review-modal-byline" });
  const avatar = el("div", { className: "atv-review-modal-avatar" });
  if (review.avatar) {
    avatar.style.backgroundImage = `url("${review.avatar}")`;
  } else {
    avatar.textContent = displayName.slice(0, 1).toUpperCase();
  }
  byline.append(avatar);

  const bylineText = el("div", { className: "atv-review-modal-byline-text" });
  bylineText.append(
    el("span", { className: "atv-review-modal-byline-name", text: displayName })
  );
  if (review.time) {
    bylineText.append(
      el("span", {
        className: "atv-review-modal-byline-time",
        text: `· ${review.time}`,
      })
    );
  }
  byline.append(bylineText);
  modalHeader.append(byline);
};

const buildModalContentBody = (
  review: Review,
  nativeItem: Element,
  getOverlay: () => HTMLElement | null
): HTMLElement => {
  const contentDiv = el("div", {
    attrs: { "aria-live": "polite" },
    className: "atv-review-modal-body",
  });
  const numericId = reviewNumericId(review.id);
  const fullContent = nativeItem.querySelector<HTMLElement>(
    `#review_${numericId}_full .review-content`
  );

  if (fullContent && (fullContent.textContent ?? "").trim().length > 0) {
    const clone = fullContent.cloneNode(true) as HTMLElement;
    contentDiv.append(clone);
    stripUnfold(contentDiv);
  } else {
    void loadReviewContent(numericId, contentDiv, getOverlay);
  }

  return contentDiv;
};

const buildModalHeader = (review: Review, displayName: string): HTMLElement => {
  const modalHeader = el("div", { className: "atv-review-modal-header" });
  const modalTitle = el("div", {
    attrs: { tabindex: "-1" },
    className: "atv-review-modal-title",
    id: "atv-review-modal-title",
    text: review.title,
  });
  modalHeader.append(modalTitle);
  if (review.stars > 0) {
    modalHeader.append(
      renderStars(review.stars, {
        className: "atv-review-modal-stars",
        outOfFive: true,
      })
    );
  }
  appendReviewByline(modalHeader, review, displayName);
  return modalHeader;
};

const buildVoteRow = (
  review: Review,
  card: HTMLElement | undefined,
  onVote: ReviewVoteCallback | undefined
): HTMLElement => {
  const voteRow = el("div", { className: "atv-review-modal-votes" });
  const cardActions = card?.querySelector<HTMLElement>(
    `.atv-review-actions[data-rid="${review.id}"]`
  );
  if (cardActions) {
    for (const btn of cardActions.querySelectorAll(".atv-vote-btn")) {
      btn.classList.add("is-lg");
    }
    voteRow.append(cardActions);
    return voteRow;
  }

  const { downBtn, upBtn } = buildReviewVotePair(
    review.id,
    review.usefulCount ?? 0,
    review.uselessCount ?? 0,
    onVote
  );
  upBtn.classList.add("is-lg");
  downBtn.classList.add("is-lg");
  voteRow.append(upBtn, downBtn);
  return voteRow;
};

const restoreVoteRow = (
  review: Review,
  card: HTMLElement | undefined
): void => {
  const moved = document.querySelector(
    `.atv-review-modal-votes > .atv-review-actions[data-rid="${review.id}"]`
  );
  if (!moved || !card) {
    return;
  }
  for (const btn of moved.querySelectorAll(".atv-vote-btn")) {
    btn.classList.remove("is-lg");
  }
  card.querySelector(".atv-review-foot")?.append(moved);
};

const openReviewModal = (
  review: Review,
  card?: HTMLElement,
  onVote?: ReviewVoteCallback
): void => {
  const nativeItem = document.querySelector(`[id="${review.id}"]`);
  if (!nativeItem) {
    window.open(
      `https://movie.douban.com/review/${reviewNumericId(review.id)}/`,
      "_blank"
    );
    return;
  }

  const displayName = reviewDisplayName(review.name);
  let modalOpen = true;
  let modalOverlay: HTMLElement | null = null;
  const getOverlay = (): HTMLElement | null =>
    modalOpen ? modalOverlay : null;

  const content = el("div", { className: "atv-review-modal-scroll" });
  content.append(el("div", { className: "atv-review-modal-accent" }));

  const modalHeader = buildModalHeader(review, displayName);
  content.append(modalHeader);
  content.append(buildModalContentBody(review, nativeItem, getOverlay));
  content.append(buildVoteRow(review, card, onVote));
  content.append(
    el("div", { className: "atv-review-modal-link" }, [
      el("a", {
        className: "atv-review-modal-link-a",
        href: `https://movie.douban.com/review/${reviewNumericId(review.id)}/`,
        rel: "noopener",
        target: "_blank",
        text: "查看豆瓣原文 →",
      }),
    ])
  );

  let reviewModalKeydown: ((event: KeyboardEvent) => void) | null = null;
  const { closeBtn, overlay } = createOverlay({
    className: "atv-review-modal",
    content: [content],
    id: "atv-review-modal",
    onClose: () => {
      modalOpen = false;
      if (reviewModalKeydown && modalOverlay) {
        modalOverlay.removeEventListener("keydown", reviewModalKeydown);
      }
      restoreVoteRow(review, card);
      card?.focus({ preventScroll: true });
    },
  });
  modalOverlay = overlay;
  modalHeader.before(closeBtn);
  overlay.setAttribute("aria-labelledby", "atv-review-modal-title");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("role", "dialog");
  closeBtn.setAttribute("aria-label", "关闭影评");
  const modalTitle = modalHeader.querySelector<HTMLElement>(
    "#atv-review-modal-title"
  );
  if (modalTitle) {
    reviewModalKeydown = trapReviewModalFocus(overlay, modalTitle);
  }
};

export { openReviewModal };
