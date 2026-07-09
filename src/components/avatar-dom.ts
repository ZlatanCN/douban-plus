import type { Comment } from "@/types";

/* ── Internal Helpers ──────────────────────────────────── */

const updateAvatarDom = (url: string, selector: string, retries = 5): void => {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    if (retries > 0) {
      requestAnimationFrame(() => updateAvatarDom(url, selector, retries - 1));
    }
    return;
  }

  /* Update DOM immediately — tests check synchronously */
  el.style.backgroundImage = `url("${url}")`;
  el.textContent = "";
  el.classList.add("atv-avatar-loaded");

  /* Preload image for browser cache (fire-and-forget) */
  try {
    const img = new Image();
    img.addEventListener("error", () => {
      console.warn("[AVATAR] preload FAILED for", url);
    });
    img.src = url;
  } catch {
    /* Preload unavailable — DOM is already updated */
  }
};

/* ── Public API ────────────────────────────────────────── */

const applyCommentAvatars = (
  urlMap: Map<string, string>,
  comments: Comment[]
): void => {
  for (const comment of comments) {
    const url = urlMap.get(comment.link);
    if (!url) {
      continue;
    }

    comment.avatar = url;
    updateAvatarDom(
      url,
      `.atv-comment-card[data-cid="${comment.cid}"] .atv-comment-avatar`
    );
    updateAvatarDom(
      url,
      `.atv-comment-overlay-avatar[data-cid="${comment.cid}"]`
    );
  }
};

export { applyCommentAvatars };
