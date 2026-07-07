import { el } from "../../components";

type OverlayAccessor = () => HTMLElement | null;

const stripUnfold = (root: HTMLElement): void => {
  for (const node of root.querySelectorAll(".short-content, a.unfold")) {
    node.remove();
  }
};

const showReviewContentError = (
  contentDiv: HTMLElement,
  onRetry: () => void
): void => {
  contentDiv.classList.remove("is-skeleton");
  contentDiv.classList.add("is-error");
  contentDiv.setAttribute("aria-busy", "false");
  contentDiv.innerHTML = "";

  const retry = el("button", {
    attrs: { type: "button" },
    className: "atv-review-modal-retry",
    text: "重新加载",
  });
  retry.addEventListener("click", onRetry);

  const error = el("div", { className: "atv-review-modal-error" });
  error.append(el("p", { text: "影评内容暂时加载失败" }), retry);
  contentDiv.append(error);
};

const loadReviewContent = async (
  numericId: string,
  contentDiv: HTMLElement,
  getOverlay: OverlayAccessor
): Promise<void> => {
  contentDiv.classList.remove("is-error");
  contentDiv.classList.add("is-skeleton");
  contentDiv.setAttribute("aria-busy", "true");
  contentDiv.textContent = "加载中";

  try {
    const res = await fetch(`https://movie.douban.com/review/${numericId}/`);
    if (!getOverlay()?.isConnected) {
      return;
    }
    if (!res.ok) {
      throw new Error(String(res.status));
    }

    const html = await res.text();
    if (!getOverlay()?.isConnected) {
      return;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const full = doc.querySelector<HTMLElement>(".review-content");
    if (!full) {
      throw new Error("no content");
    }

    if (!getOverlay()?.isConnected) {
      return;
    }
    contentDiv.classList.remove("is-skeleton", "is-error");
    contentDiv.setAttribute("aria-busy", "false");
    contentDiv.innerHTML = full.innerHTML.replaceAll(/\sstyle="[^"]*"/giu, "");
    stripUnfold(contentDiv);
  } catch {
    if (!getOverlay()?.isConnected) {
      return;
    }
    showReviewContentError(contentDiv, () => {
      void loadReviewContent(numericId, contentDiv, getOverlay);
    });
  }
};

export { loadReviewContent, stripUnfold };
