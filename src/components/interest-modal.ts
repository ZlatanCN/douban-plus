import type { InterestState, ModalCallbacks } from "../types";
import { INTEREST_LABELS } from "../types";
import { buildInterestModalContent } from "./interest-modal-content";
import { createOverlay } from "./overlay";

type LoadingState = { loading: boolean };

const openInterestModal = (
  state: InterestState,
  callbacks: ModalCallbacks
): void => {
  /* ── Build content using pure builder ── */

  const content = buildInterestModalContent(state);
  const loading: LoadingState = { loading: false };

  /* ── Extract children from builder's overlay ── */

  const children: HTMLElement[] = [];
  while (content.overlay.firstElementChild) {
    const child = content.overlay.firstElementChild as HTMLElement;
    child.remove();
    children.push(child);
  }

  /* ── Create overlay with scaffold behavior ── */

  const { dismiss } = createOverlay({
    className: "atv-interest-modal",
    content: children,
    id: "atv-interest-modal",
  });

  /* ── Status button wiring ── */

  for (const btn of content.statusBtns) {
    const value = btn.dataset.value as "wish" | "do" | "collect";
    btn.addEventListener("click", () => {
      if (loading.loading) {
        return;
      }
      content.form.status = value;
      for (const b of content.statusBtns) {
        b.classList.toggle("is-active", b === btn);
      }
      const prefix = state.marked ? "修改" : "标记";
      content.titleSpan.textContent = `${prefix}${INTEREST_LABELS[value]}`;
    });
  }

  /* ── Submit ── */

  content.submitBtn.addEventListener("click", async () => {
    if (loading.loading) {
      return;
    }
    loading.loading = true;
    content.starRating.setIsLoading(true);
    content.submitBtn.textContent = "保存中...";
    content.submitBtn.disabled = true;
    content.errorEl.textContent = "";

    const result = await callbacks.onSave({
      comment: content.commentTextarea.value.trim(),
      rating: content.starRating.currentRating(),
      status: content.form.status,
    });

    if (result.ok) {
      dismiss();
    } else {
      loading.loading = false;
      content.starRating.setIsLoading(false);
      content.submitBtn.textContent = "保存";
      content.submitBtn.disabled = false;
      content.errorEl.textContent = result.error || "操作失败";
    }
  });

  /* ── Remove (conditional) ── */

  const { removeBtn } = content;
  if (removeBtn) {
    removeBtn.addEventListener("click", async () => {
      if (loading.loading) {
        return;
      }
      loading.loading = true;
      content.starRating.setIsLoading(true);
      content.submitBtn.disabled = true;
      removeBtn.disabled = true;
      content.errorEl.textContent = "";

      const result = await callbacks.onRemove(state.status);

      if (result.ok) {
        dismiss();
      } else {
        loading.loading = false;
        content.starRating.setIsLoading(false);
        content.submitBtn.disabled = false;
        removeBtn.disabled = false;
        content.errorEl.textContent = result.error || "取消标记失败";
      }
    });
  }

  /* ── Note: Mount + scroll lock + rAF is handled by createOverlay ── */
};

export { openInterestModal };
