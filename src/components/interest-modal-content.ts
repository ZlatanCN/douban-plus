import { ICON_STAR_FULL, ICON_STAR_EMPTY } from "../constants";
import type { InterestState } from "../types";
import { INTEREST_LABELS } from "../types";
import { el, renderStarRating } from "./dom-factory";

/* ── Types ────────────────────────────────────────────── */

type StarRating = {
  container: HTMLDivElement;
  /** Update displayed rating after external change */
  setRating: (n: number) => void;
  /** Read current committed rating */
  currentRating: () => number;
  /** Enable/disable click interaction */
  setIsLoading: (v: boolean) => void;
};

type InterestModalContent = {
  overlay: HTMLDivElement;
  closeBtn: HTMLButtonElement;
  titleSpan: HTMLSpanElement;
  statusContainer: HTMLDivElement;
  statusBtns: HTMLButtonElement[];
  starRating: StarRating;
  commentTextarea: HTMLTextAreaElement;
  submitBtn: HTMLButtonElement;
  removeBtn: HTMLButtonElement | null;
  errorEl: HTMLDivElement;
  /** Initial form state — lifecycle reads/writes status */
  form: { status: "wish" | "do" | "collect" };
};

/* ── buildStarRating — mini-component ────────────────── */

/**
 * Build a 5-star rating widget with hover/click/leave interaction.
 * Hover: preview stars up to hovered index (visual only).
 * Click: commit rating, update display.
 * Leave: reset display to committed rating.
 * When isLoading() returns true, click is a no-op.
 */
const buildStarRating = (initialRating: number): StarRating => {
  const container = el("div", { className: "atv-interest-modal-stars" });
  const starEls: HTMLSpanElement[] = [];
  let rating = initialRating;
  let loading = false;

  const update = (n: number): void => {
    renderStarRating(starEls, n);
  };

  const createStar = (position: number): void => {
    const idx = position;
    const full = idx <= rating;
    const star = el("span", {
      className: `atv-interest-modal-star${full ? " is-full" : ""}`,
      html: full ? ICON_STAR_FULL : ICON_STAR_EMPTY,
    });
    star.addEventListener("click", () => {
      if (loading) {
        return;
      }
      rating = idx;
      update(idx);
    });
    star.addEventListener("mouseenter", () => update(idx));
    starEls.push(star);
    container.append(star);
  };

  for (let idx = 1; idx <= 5; idx += 1) {
    createStar(idx);
  }

  container.addEventListener("mouseleave", () => {
    update(rating);
  });

  const setRating = (n: number): void => {
    rating = n;
    update(n);
  };

  const currentRating = (): number => rating;

  const setIsLoading = (v: boolean): void => {
    loading = v;
  };

  return { container, currentRating, setIsLoading, setRating };
};

/* ── buildInterestModalContent — pure DOM builder ─────── */

const buildInterestModalContent = (
  state: InterestState
): InterestModalContent => {
  /* ── Overlay ── */

  const overlay = el("div", {
    className: "atv-interest-modal",
    id: "atv-interest-modal",
  });

  const errorEl = el("div", { className: "atv-interest-modal-error" });

  /* ── Header ── */

  const titleText =
    state.marked && state.status !== "none"
      ? `修改${INTEREST_LABELS[state.status]}`
      : "标记想看";
  const titleSpan = el("span", {
    className: "atv-interest-modal-header__title",
    text: titleText,
  });

  const closeBtn = el("button", {
    attrs: { type: "button" },
    className: "atv-interest-modal-close",
    html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
  });

  const header = el("div", { className: "atv-interest-modal-header" }, [
    titleSpan,
    closeBtn,
  ]);

  /* ── Status radio group ── */

  const initStatus: "wish" | "do" | "collect" =
    state.marked && state.status !== "none" ? state.status : "wish";

  const statusEntries: { value: "wish" | "do" | "collect"; label: string }[] = [
    { label: "想看", value: "wish" },
    ...(state.hasWatching ? [{ label: "在看", value: "do" as const }] : []),
    { label: "看过", value: "collect" },
  ];

  const statusBtns: HTMLButtonElement[] = [];
  const statusContainer = el("div", {
    className: "atv-interest-modal-statuses",
  });

  for (const entry of statusEntries) {
    const btn = el("button", {
      attrs: { "data-value": entry.value, type: "button" },
      className: `atv-interest-modal-status${entry.value === initStatus ? " is-active" : ""}`,
      text: entry.label,
    });
    statusBtns.push(btn);
    statusContainer.append(btn);
  }

  /* ── Star rating (mini-component with internal events) ── */

  const starRating = buildStarRating(state.rating || 0);

  /* ── Short review ── */

  const commentTextarea = el("textarea", {
    attrs: { maxlength: "350", placeholder: "写一段短评…", rows: "3" },
    className: "atv-interest-modal-comment",
    text: state.comment || "",
  });

  /* ── Submit / Remove buttons ── */

  const submitBtn = el("button", {
    attrs: { type: "button" },
    className: "atv-interest-modal-submit",
    text: "保存",
  });

  const removeBtn = state.marked
    ? el("button", {
        attrs: { type: "button" },
        className: "atv-interest-modal-remove",
        text: "取消标记",
      })
    : null;

  /* ── Assemble body ── */

  const body = el("div", { className: "atv-interest-modal-body" }, [
    statusContainer,
    starRating.container,
    commentTextarea,
    submitBtn,
  ]);

  if (removeBtn) {
    body.append(removeBtn);
  }

  body.append(errorEl);

  const accent = el("div", { className: "atv-interest-modal-accent" });
  const inner = el("div", { className: "atv-interest-modal-inner" }, [
    accent,
    header,
    body,
  ]);
  overlay.append(inner);

  return {
    closeBtn,
    commentTextarea,
    errorEl,
    form: { status: initStatus },
    overlay,
    removeBtn,
    starRating,
    statusBtns,
    statusContainer,
    submitBtn,
    titleSpan,
  };
};

export { buildInterestModalContent, buildStarRating };
export type { InterestModalContent, StarRating };
