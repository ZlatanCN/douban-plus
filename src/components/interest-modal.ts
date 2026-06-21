import { ICON_STAR_FULL, ICON_STAR_EMPTY } from "../constants";
import type { InterestState, ModalCallbacks } from "../types";
import { INTEREST_LABELS } from "../types";
import { el } from "./dom-factory";

type FormState = {
  status: "wish" | "do" | "collect";
  rating: number;
  loading: boolean;
};

const openInterestModal = (
  state: InterestState,
  callbacks: ModalCallbacks
): void => {
  const old = document.querySelector("#atv-interest-modal");
  if (old) {
    old.remove();
  }

  const overlay = el("div", {
    className: "atv-interest-modal",
    id: "atv-interest-modal",
  });

  const form: FormState = {
    loading: false,
    rating: state.rating || 0,
    status: state.marked && state.status !== "none" ? state.status : "wish",
  };

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
      className: `atv-interest-modal-status${entry.value === form.status ? " is-active" : ""}`,
      text: entry.label,
    });
    btn.addEventListener("click", () => {
      if (form.loading) {
        return;
      }
      form.status = entry.value;
      for (const b of statusBtns) {
        b.classList.toggle("is-active", b === btn);
      }
      const prefix = state.marked ? "修改" : "标记";
      titleSpan.textContent = `${prefix}${INTEREST_LABELS[entry.value]}`;
    });
    statusBtns.push(btn);
    statusContainer.append(btn);
  }

  /* ── Star rating ── */

  const starContainer = el("div", { className: "atv-interest-modal-stars" });
  const starEls: HTMLSpanElement[] = [];

  const updateStars = (count: number): void => {
    for (let idx = 0; idx < 5; idx += 1) {
      const full = idx < count;
      starEls[idx].innerHTML = full ? ICON_STAR_FULL : ICON_STAR_EMPTY;
      starEls[idx].classList.toggle("is-full", full);
    }
  };

  for (let idx = 1; idx <= 5; idx += 1) {
    const full = idx <= form.rating;
    const star = el("span", {
      className: `atv-interest-modal-star${full ? " is-full" : ""}`,
      html: full ? ICON_STAR_FULL : ICON_STAR_EMPTY,
    });
    star.addEventListener("click", () => {
      if (form.loading) {
        return;
      }
      form.rating = idx;
      updateStars(idx);
    });
    star.addEventListener("mouseenter", () => updateStars(idx));
    starEls.push(star);
    starContainer.append(star);
  }

  starContainer.addEventListener("mouseleave", () => {
    updateStars(form.rating);
  });

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

  const removeBtn = el("button", {
    attrs: { type: "button" },
    className: "atv-interest-modal-remove",
    text: "取消标记",
  });

  /* ── Dismiss ── */

  const dismiss = (): void => {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      overlay.remove();
    }, 350);
  };

  closeBtn.addEventListener("click", dismiss);

  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay) {
      dismiss();
    }
  });

  document.addEventListener("keydown", function handler(e: KeyboardEvent) {
    if (e.key === "Escape") {
      dismiss();
      document.removeEventListener("keydown", handler);
    }
  });

  /* ── Submit handler ── */

  submitBtn.addEventListener("click", async () => {
    if (form.loading) {
      return;
    }
    form.loading = true;
    submitBtn.textContent = "保存中...";
    submitBtn.disabled = true;
    errorEl.textContent = "";

    const result = await callbacks.onSave({
      comment: commentTextarea.value.trim(),
      rating: form.rating,
      status: form.status,
    });

    if (result.ok) {
      dismiss();
    } else {
      form.loading = false;
      submitBtn.textContent = "保存";
      submitBtn.disabled = false;
      errorEl.textContent = result.error || "操作失败";
    }
  });

  /* ── Remove handler ── */

  removeBtn.addEventListener("click", async () => {
    if (form.loading) {
      return;
    }
    form.loading = true;
    submitBtn.disabled = true;
    removeBtn.disabled = true;
    errorEl.textContent = "";

    const result = await callbacks.onRemove(state.status);

    if (result.ok) {
      dismiss();
    } else {
      form.loading = false;
      submitBtn.disabled = false;
      removeBtn.disabled = false;
      errorEl.textContent = result.error || "取消标记失败";
    }
  });

  /* ── Assemble ── */

  const body = el("div", { className: "atv-interest-modal-body" }, [
    statusContainer,
    starContainer,
    commentTextarea,
    submitBtn,
  ]);

  if (state.marked) {
    body.append(removeBtn);
  }

  body.append(errorEl);

  const inner = el("div", { className: "atv-interest-modal-inner" }, [
    header,
    body,
  ]);
  overlay.append(inner);

  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));
};

export { openInterestModal };
