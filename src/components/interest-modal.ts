import type { InterestState, ModalCallbacks } from "../types";
import { INTEREST_LABELS } from "../types";
import { buildInterestModalContent } from "./interest-modal-content";

type LoadingState = { loading: boolean };

const openInterestModal = (
  state: InterestState,
  callbacks: ModalCallbacks
): void => {
  /* ── Cleanup old instance ── */

  const old = document.querySelector("#atv-interest-modal");
  if (old) {
    old.remove();
  }

  /* ── Build DOM ── */

  const content = buildInterestModalContent(state);
  const loading: LoadingState = { loading: false };

  /* ── Dismiss ── */

  const dismiss = (): void => {
    if (!content.overlay.isConnected) {
      return;
    }
    content.overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      content.overlay.remove();
    }, 350);
  };

  content.closeBtn.addEventListener("click", dismiss);

  content.overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === content.overlay) {
      dismiss();
    }
  });

  const keyHandler = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      dismiss();
      document.removeEventListener("keydown", keyHandler);
    }
  };
  document.addEventListener("keydown", keyHandler);

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

  /* ── Mount ── */

  document.body.append(content.overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => content.overlay.classList.add("is-open"));
};

export { openInterestModal };
