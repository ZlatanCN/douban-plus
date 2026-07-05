import { createOverlay, el, renderStars } from "../components";
import { ICON_EXPAND, ICON_THUMB } from "../constants";
import type { Comment, CommentsData } from "../types";
import { buildSection } from "./sections";

/* ── buildComments ────────────────────────────────────── */

/**
 * Callback invoked when a user votes on a comment.
 * Returns updated count on success, or { ok: false } on failure for rollback.
 */
type VoteCallback = (cid: string) => Promise<{ ok: boolean; count?: number }>;

/* ── openCommentOverlay ───────────────────────────────── */

const openCommentOverlay = (comment: Comment, onVote: VoteCallback): void => {
  const inner = el("div", { className: "atv-comment-overlay-inner" });

  const accent = el("div", { className: "atv-comment-overlay-accent" });
  inner.append(accent);

  const top = el("div", { className: "atv-comment-overlay-top" });
  const avatar = el("div", {
    attrs: comment.cid ? { "data-cid": comment.cid } : undefined,
    className: "atv-comment-overlay-avatar",
  });
  if (comment.avatar) {
    avatar.style.backgroundImage = `url("${comment.avatar}")`;
  } else {
    avatar.textContent = (comment.name || "?").slice(0, 1).toUpperCase();
  }
  top.append(avatar);

  const meta = el("div", { className: "atv-comment-overlay-meta" });
  const author = el(comment.link ? "a" : "div", {
    className: "atv-comment-overlay-author",
    href: comment.link || undefined,
    rel: comment.link ? "noopener" : undefined,
    target: comment.link ? "_blank" : undefined,
    text: comment.name,
  });
  meta.append(author);
  if (comment.stars > 0) {
    meta.append(
      renderStars(comment.stars, {
        className: "atv-comment-overlay-stars",
        outOfFive: true,
      })
    );
  }
  top.append(meta);
  inner.append(top);

  const body = el("div", {
    className: "atv-comment-overlay-body",
    text: comment.content,
  });
  inner.append(body);

  const foot = el("div", { className: "atv-comment-overlay-foot" });
  foot.append(
    el("span", {
      className: "atv-comment-overlay-time",
      text: comment.time || "",
    })
  );

  const voteBtn = el("button", {
    attrs: { type: "button" },
    className: "atv-comment-overlay-votes",
  });
  const voteIcon = el("span", { html: ICON_THUMB });
  const voteCount = el("span", { text: String(comment.votes) });
  voteBtn.append(voteIcon, voteCount);

  let count = comment.votes;
  let { voted } = comment;
  if (voted) {
    voteBtn.classList.add("is-voted");
  }

  const animateBtn = (): void => {
    voteBtn.style.transform = "scale(1.2)";
    requestAnimationFrame(() => {
      voteBtn.style.transform = "";
    });
  };

  voteBtn.addEventListener("click", async () => {
    if (voted || !comment.cid) {
      return;
    }
    voted = true;
    count += 1;
    voteCount.textContent = String(count);
    voteBtn.classList.add("is-voted");
    animateBtn();

    const result = await onVote(comment.cid);
    if (result.ok && result.count !== undefined) {
      ({ count } = result);
      voteCount.textContent = String(count);
    } else {
      voted = false;
      count -= 1;
      voteCount.textContent = String(count);
      voteBtn.classList.remove("is-voted");
    }
  });

  foot.append(voteBtn);
  inner.append(foot);
  createOverlay({
    className: "atv-comment-overlay",
    closeSize: 16,
    content: [inner],
    id: "atv-comment-overlay",
  });
};

/* ── buildComments ────────────────────────────────────── */

const buildComments = (
  data: CommentsData,
  onVote: VoteCallback
): HTMLElement | null => {
  if (!data.comments?.length) {
    return null;
  }
  const grid = el("div", { className: "atv-comments" });
  const pending: { card: HTMLElement; body: HTMLElement }[] = [];
  for (const c of data.comments) {
    const card = el("div", {
      attrs: c.cid ? { "data-cid": c.cid } : undefined,
      className: "atv-comment-card",
    });

    const top = el("div", { className: "atv-comment-top" });
    const avatar = el("div", { className: "atv-comment-avatar" });
    if (c.avatar) {
      avatar.style.backgroundImage = `url("${c.avatar}")`;
    } else {
      avatar.textContent = (c.name || "?").slice(0, 1).toUpperCase();
    }
    top.append(avatar);

    const metaCol = el("div", { className: "atv-comment-meta" });
    const author = el(c.link ? "a" : "div", {
      className: "atv-comment-author",
      href: c.link || undefined,
      rel: c.link ? "noopener" : undefined,
      target: c.link ? "_blank" : undefined,
      text: c.name,
    });
    metaCol.append(author);
    if (c.stars > 0) {
      metaCol.append(
        renderStars(c.stars, {
          className: "atv-comment-stars",
          outOfFive: true,
        })
      );
    }
    top.append(metaCol);
    card.append(top);

    const body = el("div", { className: "atv-comment-body", text: c.content });
    card.append(body);

    const foot = el("div", { className: "atv-comment-foot" });
    foot.append(el("span", { text: c.time || "" }));

    const footRight = el("div", { className: "atv-comment-foot-right" });
    const expandBtn = el("button", {
      attrs: { type: "button" },
      className: "atv-comment-expand",
      html: ICON_EXPAND,
    });

    const voteBtn = el("button", {
      attrs: { type: "button" },
      className: "atv-comment-votes",
    });
    const voteIcon = el("span", { html: ICON_THUMB });
    const voteCount = el("span", { text: String(c.votes) });
    voteBtn.append(voteIcon, voteCount);

    let count = c.votes;
    let { voted } = c;
    if (voted) {
      voteBtn.classList.add("is-voted");
    }

    const animateBtn = () => {
      voteBtn.style.transform = "scale(1.2)";
      requestAnimationFrame(() => {
        voteBtn.style.transform = "";
      });
    };

    voteBtn.addEventListener("click", async () => {
      if (voted || !c.cid) {
        return;
      }

      voted = true;
      count += 1;
      voteCount.textContent = String(count);
      voteBtn.classList.add("is-voted");
      animateBtn();

      const result = await onVote(c.cid);
      if (result.ok && result.count !== undefined) {
        ({ count } = result);
        voteCount.textContent = String(count);
      } else {
        voted = false;
        count -= 1;
        voteCount.textContent = String(count);
        voteBtn.classList.remove("is-voted");
      }
    });
    footRight.append(expandBtn, voteBtn);
    foot.append(footRight);
    card.append(foot);

    const showOverlay = (): void => {
      openCommentOverlay(c, onVote);
    };
    expandBtn.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      showOverlay();
    });
    body.addEventListener("click", () => {
      if (body.scrollHeight > body.clientHeight) {
        showOverlay();
      }
    });

    grid.append(card);
    pending.push({ body, card });
  }

  /* Deferred overflow detection after DOM insertion */
  setTimeout(() => {
    requestAnimationFrame(() => {
      for (const { card, body: b } of pending) {
        if (b.scrollHeight > b.clientHeight) {
          card.classList.add("has-overflow");
        }
      }
    });
  }, 0);

  const allHref = data.subjectId
    ? `https://movie.douban.com/subject/${data.subjectId}/comments?status=P`
    : "";
  return buildSection("atv-comments", "热门短评", grid, {
    moreLink: allHref ? { href: allHref, text: "查看全部 →" } : undefined,
  });
};

/* ── Exports ──────────────────────────────────────────── */

export { buildComments };
