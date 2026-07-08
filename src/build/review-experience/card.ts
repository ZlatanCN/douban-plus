import { el, renderStars } from "../../components";
import type {
  AccountActionGuard,
  Review,
  ReviewVoteCallback,
} from "../../types";
import { reviewDisplayName } from "./identity";
import { openReviewModal } from "./modal";
import { buildReviewVotePair } from "./vote-pair";

const isNestedReviewControl = (
  target: EventTarget | null,
  card: HTMLElement
): boolean => {
  if (!(target instanceof Element) || target === card) {
    return false;
  }

  const control = target.closest("a, button");
  return Boolean(control && card.contains(control));
};

const appendReviewCardTop = (
  card: HTMLElement,
  review: Review,
  displayName: string
): void => {
  const top = el("div", { className: "atv-review-top" });
  const avatar = el("div", { className: "atv-review-avatar" });
  if (review.avatar) {
    avatar.style.backgroundImage = `url("${review.avatar}")`;
  } else {
    avatar.textContent = displayName.slice(0, 1).toUpperCase();
  }
  top.append(avatar);

  const meta = el("div", { className: "atv-review-meta" });
  meta.append(
    el(review.link ? "a" : "div", {
      className: "atv-review-author",
      href: review.link || undefined,
      rel: review.link ? "noopener" : undefined,
      target: review.link ? "_blank" : undefined,
      text: displayName,
    })
  );
  if (review.stars > 0) {
    meta.append(
      renderStars(review.stars, {
        className: "atv-review-stars",
        outOfFive: true,
      })
    );
  }
  top.append(meta);
  card.append(top);
};

const buildReviewFoot = (
  review: Review,
  onVote: ReviewVoteCallback | undefined,
  canVote?: AccountActionGuard
): HTMLElement => {
  const foot = el("div", { className: "atv-review-foot" });
  foot.append(
    el("span", { className: "atv-review-time", text: review.time || "" })
  );
  foot.append(
    el("span", { className: "atv-review-readmore", text: "展开阅读" })
  );

  const actions = el("div", {
    attrs: review.id ? { "data-rid": review.id } : undefined,
    className: "atv-review-actions",
  });
  if (review.usefulCount !== undefined || review.uselessCount !== undefined) {
    const { downBtn, upBtn } = buildReviewVotePair(
      review.id,
      review.usefulCount ?? 0,
      review.uselessCount ?? 0,
      onVote,
      canVote
    );
    actions.append(upBtn, downBtn);
  }
  foot.append(actions);
  return foot;
};

const bindReviewCardInteractions = (
  card: HTMLElement,
  review: Review,
  onVote: ReviewVoteCallback | undefined,
  canVote?: AccountActionGuard
): void => {
  card.addEventListener("click", (event: MouseEvent) => {
    if (isNestedReviewControl(event.target, card)) {
      return;
    }
    openReviewModal(review, card, onVote, canVote);
  });
  card.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.target !== card) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    openReviewModal(review, card, onVote, canVote);
  });
};

const buildReviewCard = (
  review: Review,
  onVote: ReviewVoteCallback | undefined,
  canVote?: AccountActionGuard
): HTMLElement => {
  const displayName = reviewDisplayName(review.name);
  const card = el("div", {
    attrs: {
      ...(review.id ? { "data-rid": review.id } : {}),
      "aria-label": `展开阅读：${review.title}`,
      role: "button",
      tabindex: "0",
    },
    className: "atv-review-card",
  });

  appendReviewCardTop(card, review, displayName);
  card.append(el("div", { className: "atv-review-title", text: review.title }));
  card.append(
    el("div", { className: "atv-review-excerpt", text: review.content })
  );
  card.append(buildReviewFoot(review, onVote, canVote));
  bindReviewCardInteractions(card, review, onVote, canVote);
  card.style.cursor = "pointer";

  return card;
};

export { buildReviewCard };
