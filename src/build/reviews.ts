/* ── Reviews Section Builder ───────────────────────────── */
/* Builds the long-form review cards section.               */

import { el, renderStars, createOverlay } from "../components";
import { buildSection } from "../components/sections";
import type { Review, ReviewData, ReviewVoteCallback } from "../types";
import { createCache } from "../utils/cache";

/* ── Helpers ──────────────────────────────────────────── */

/** Extract numeric review ID from a DOM element id like "review_17191063". */
const reviewNumericId = (rid: string): string => {
  const m = rid.match(/(?<num>\d+)$/u);
  return m?.groups?.num ?? rid;
};

/* ── Review vote state cache (cross-page-load) ───────── */

const voteCache = createCache<"up" | "down">(
  "atv:review:vote",
  365 * 24 * 60 * 60 * 1000
);

const getReviewVotePersisted = (rid: string): "up" | "down" | null =>
  voteCache.get(rid) ?? null;

const persistReviewVote = (rid: string, dir: "up" | "down"): void => {
  voteCache.set(rid, dir);
};

/* ── API-driven review vote button pair ───────────────── */

const buildReviewVotePair = (
  rid: string,
  usefulInit: number,
  uselessInit: number,
  votedUpInit: boolean,
  votedDownInit: boolean,
  onVote: ReviewVoteCallback | undefined
): { upBtn: HTMLButtonElement; downBtn: HTMLButtonElement } => {
  let usefulCount = usefulInit;
  let uselessCount = uselessInit;
  let votedUp = votedUpInit;
  let votedDown = votedDownInit;
  let voting = false;

  const upBtn = el("button", {
    className: "atv-vote-btn up",
    text: `有用 ${usefulCount}`,
  });
  const downBtn = el("button", {
    className: "atv-vote-btn down",
    text: `没用 ${uselessCount}`,
  });

  const sync = (): void => {
    upBtn.textContent = `有用 ${usefulCount}`;
    downBtn.textContent = `没用 ${uselessCount}`;
    upBtn.classList.toggle("is-voted", votedUp);
    downBtn.classList.toggle("is-voted", votedDown);
  };

  /* Apply initial is-voted state without waiting for sync() call */
  if (votedUp) {
    upBtn.classList.add("is-voted");
  }
  if (votedDown) {
    downBtn.classList.add("is-voted");
  }

  const vote = async (type: "up" | "down"): Promise<void> => {
    if (voting) {
      return;
    }
    if ((type === "up" && votedUp) || (type === "down" && votedDown)) {
      return;
    }
    if (!onVote) {
      return;
    }

    voting = true;
    const apiType = type === "up" ? "useful" : "useless";
    const numericId = reviewNumericId(rid);

    /* Snapshot for rollback */
    const prev = { usefulCount, uselessCount, votedDown, votedUp };

    /* Optimistic: mutual-exclusive — voting one cancels the other */
    if (type === "up") {
      if (votedDown) {
        uselessCount -= 1;
        votedDown = false;
      }
      usefulCount += 1;
      votedUp = true;
    } else {
      if (votedUp) {
        usefulCount -= 1;
        votedUp = false;
      }
      uselessCount += 1;
      votedDown = true;
    }
    sync();

    const result = await onVote(numericId, apiType);
    if (
      result.ok &&
      result.usefulCount !== undefined &&
      result.uselessCount !== undefined
    ) {
      ({ usefulCount, uselessCount } = result);
      persistReviewVote(numericId, type === "up" ? "up" : "down");
    } else {
      /* Revert to snapshot */
      ({ usefulCount, uselessCount } = prev);
      ({ votedUp, votedDown } = prev);
    }
    sync();
    voting = false;
  };

  upBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    vote("up");
  });
  downBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    vote("down");
  });

  return { downBtn, upBtn };
};

/* ── Review Modal ─────────────────────────────────────── */

/** Strip Douban's "展开" links & short-content wrappers — modal shows full text */
const stripUnfold = (root: HTMLElement): void => {
  for (const node of root.querySelectorAll(".short-content, a.unfold")) {
    node.remove();
  }
};

/** Open an overlay modal showing the full review content + vote buttons. */
const openReviewModal = (
  r: Review,
  card?: HTMLElement,
  onVote?: ReviewVoteCallback
): void => {
  const nativeItem = document.querySelector(`[id="${r.id}"]`);
  if (!nativeItem) {
    window.open(
      `https://movie.douban.com/review/${reviewNumericId(r.id)}/`,
      "_blank"
    );
    return;
  }

  const contentDiv = el("div", { className: "atv-review-modal-body" });

  /* Full content already loaded in DOM (review was expanded on the page)? */
  const numericId = reviewNumericId(r.id);
  const fullContent = nativeItem.querySelector<HTMLElement>(
    `#review_${numericId}_full .review-content`
  );
  if (fullContent && (fullContent.textContent ?? "").trim().length > 0) {
    const clone = fullContent.cloneNode(true) as HTMLElement;
    contentDiv.append(clone);
    stripUnfold(contentDiv);
  } else {
    /* Show loading state, then async-fetch the full review page */
    contentDiv.textContent = "加载中…";

    (async () => {
      try {
        const res = await fetch(
          `https://movie.douban.com/review/${numericId}/`
        );
        if (!res.ok) {
          contentDiv.textContent = "加载失败";
          return;
        }
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const full = doc.querySelector<HTMLElement>(".review-content");
        if (!full) {
          contentDiv.textContent = "无法获取评论内容";
          return;
        }
        const html_ = full.innerHTML.replaceAll(/\sstyle="[^"]*"/giu, "");
        contentDiv.innerHTML = html_;
        stripUnfold(contentDiv);
      } catch {
        contentDiv.textContent = "加载失败";
      }
    })();
  }

  /* ── Build modal content ── */

  const content = el("div", { className: "atv-review-modal-scroll" });

  /* Accent bar — absolute-positioned, clips to parent border-radius via overflow-y: auto */
  content.append(el("div", { className: "atv-review-modal-accent" }));

  /* Review title + author header */
  const modalHeader = el("div", { className: "atv-review-modal-header" });
  modalHeader.append(
    el("div", { className: "atv-review-modal-title", text: r.title }),
    el("div", {
      className: "atv-review-modal-author",
      text: r.name + (r.time ? ` · ${r.time}` : ""),
    })
  );
  content.append(modalHeader);
  content.append(contentDiv);

  /* ── Vote buttons in modal — move (not clone) so card + modal ─┐ */
  /*    share the same closure state from buildReviewVotePair.     */

  const voteRow = el("div", { className: "atv-review-modal-votes" });
  const cardActions = card?.querySelector<HTMLElement>(
    `.atv-review-actions[data-rid="${r.id}"]`
  );
  if (cardActions) {
    for (const btn of cardActions.querySelectorAll(".atv-vote-btn")) {
      btn.classList.add("is-lg");
    }
    voteRow.append(cardActions);
  } else {
    /* Fallback: review without vote buttons in card */
    const modalPersisted = getReviewVotePersisted(numericId);
    const { upBtn: modalUpBtn, downBtn: modalDownBtn } = buildReviewVotePair(
      r.id,
      r.usefulCount ?? 0,
      r.uselessCount ?? 0,
      modalPersisted === "up",
      modalPersisted === "down",
      onVote
    );
    modalUpBtn.classList.add("is-lg");
    modalDownBtn.classList.add("is-lg");
    voteRow.append(modalUpBtn, modalDownBtn);
  }
  content.append(voteRow);

  /* ── Full-review link ── */

  const linkRow = el("div", { className: "atv-review-modal-link" });
  linkRow.append(
    el("a", {
      className: "atv-review-modal-link-a",
      href: `https://movie.douban.com/review/${r.id}/`,
      rel: "noopener",
      target: "_blank",
      text: "查看豆瓣原文 →",
    })
  );
  content.append(linkRow);

  createOverlay({
    className: "atv-review-modal",
    content: [content],
    id: "atv-review-modal",
    onClose: () => {
      const moved = document.querySelector(
        `.atv-review-modal-votes > .atv-review-actions[data-rid="${r.id}"]`
      );
      if (moved && card) {
        for (const btn of moved.querySelectorAll(".atv-vote-btn")) {
          btn.classList.remove("is-lg");
        }
        const foot = card.querySelector(".atv-review-foot");
        if (foot) {
          foot.append(moved);
        }
      }
    },
  });
};

/* ── Review Card Builder ──────────────────────────────── */

/** Build a single review card element. */
const buildReviewCard = (
  r: Review,
  onVote: ReviewVoteCallback | undefined
): HTMLElement => {
  const card = el("div", {
    attrs: r.id ? { "data-rid": r.id } : undefined,
    className: "atv-review-card",
  });

  /* ── Top row: avatar + name + rating ────────────── */

  const top = el("div", { className: "atv-review-top" });
  const avatar = el("div", { className: "atv-review-avatar" });
  if (r.avatar) {
    avatar.style.backgroundImage = `url("${r.avatar}")`;
  } else {
    avatar.textContent = (r.name || "?").slice(0, 1).toUpperCase();
  }
  top.append(avatar);

  const meta = el("div", { className: "atv-review-meta" });
  const author = el(r.link ? "a" : "div", {
    className: "atv-review-author",
    href: r.link || undefined,
    rel: r.link ? "noopener" : undefined,
    target: r.link ? "_blank" : undefined,
    text: r.name,
  });
  meta.append(author);
  if (r.stars > 0) {
    meta.append(
      renderStars(r.stars, {
        className: "atv-review-stars",
        outOfFive: true,
      })
    );
  }
  top.append(meta);
  card.append(top);

  /* ── Title ──────────────────────────────────────── */

  card.append(el("div", { className: "atv-review-title", text: r.title }));

  /* ── Excerpt ────────────────────────────────────── */

  card.append(el("div", { className: "atv-review-excerpt", text: r.content }));

  /* ── Footer: time + vote buttons ────────────────── */

  const foot = el("div", { className: "atv-review-foot" });
  foot.append(el("span", { className: "atv-review-time", text: r.time || "" }));
  foot.append(
    el("span", { className: "atv-review-readmore", text: "展开阅读" })
  );

  const actions = el("div", {
    attrs: r.id ? { "data-rid": r.id } : undefined,
    className: "atv-review-actions",
  });

  if (r.usefulCount !== undefined || r.uselessCount !== undefined) {
    const persisted = getReviewVotePersisted(reviewNumericId(r.id));
    const { upBtn, downBtn } = buildReviewVotePair(
      r.id,
      r.usefulCount ?? 0,
      r.uselessCount ?? 0,
      persisted === "up",
      persisted === "down",
      onVote
    );
    actions.append(upBtn, downBtn);
  }

  foot.append(actions);
  card.append(foot);

  /* ── Click → modal overlay with full content ───── */

  card.addEventListener("click", () => {
    openReviewModal(r, card, onVote);
  });
  card.style.cursor = "pointer";

  return card;
};

/* ── Build Reviews Section ────────────────────────────── */

/**
 * Build the reviews section — a grid of review cards.
 * Each card shows avatar, author, star rating, title, excerpt,
 * publish time, and useful count. Cards link to the full
 * Douban review page.
 *
 * @param data - Reviews data and subject ID for the more-link.
 * @returns The section element, or null if no reviews to show.
 */
const buildReviews = (data: ReviewData): HTMLElement | null => {
  if (!data.reviews?.length) {
    return null;
  }

  const grid = el("div", { className: "atv-reviews" });

  for (const r of data.reviews) {
    grid.append(buildReviewCard(r, data.onReviewVote));
  }

  const allHref = data.subjectId
    ? `https://movie.douban.com/subject/${data.subjectId}/reviews`
    : "";
  const sectionTitle = data.isTV ? "最热剧评" : "最热影评";
  const section = buildSection("atv-reviews", sectionTitle, grid, {
    moreLink: allHref ? { href: allHref, text: "查看全部 →" } : undefined,
  });

  return section;
};

export { buildReviews };
