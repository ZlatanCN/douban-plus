import { buildVoteBtn, createOverlay, el, renderStars } from "../components";
import { buildSection } from "../components/sections";
import type { VoteButtonElement } from "../components/vote-btn";
import { ICON_EXPAND } from "../constants";
import type { Comment, CommentsData } from "../types";

/* ── buildComments ────────────────────────────────────── */

const CLOSE_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>';

/**
 * Callback invoked when a user votes on a comment.
 * Returns updated count on success, or { ok: false } on failure for rollback.
 */
type VoteCallback = (cid: string) => Promise<{ ok: boolean; count?: number }>;

/* ── openCommentOverlay ───────────────────────────────── */

const openCommentOverlay = (
  comment: Comment,
  onVote: VoteCallback,
  cardVoteBtns: Map<string, VoteButtonElement>
): void => {
  const inner = el("div", { className: "atv-comment-overlay-inner" });

  const accent = el("div", { className: "atv-comment-overlay-accent" });
  inner.append(accent);
  const closeBtn = el("button", {
    attrs: { "aria-label": "关闭短评", type: "button" },
    className: "atv-comment-overlay-close",
    html: CLOSE_SVG,
  });
  inner.append(closeBtn);

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

  const voteBtn = buildVoteBtn({
    cid: comment.cid,
    className: "atv-comment-overlay-votes",
    count: comment.votes,
    onVote: async (cid) => {
      const result = await onVote(cid);
      if (result.ok && result.count !== undefined) {
        comment.voted = true;
        comment.votes = result.count;
        const cardBtn = cardVoteBtns.get(cid);
        if (cardBtn) {
          cardBtn.setVoteState(true, result.count);
        }
      }
      return result;
    },
    voted: comment.voted,
  });

  foot.append(voteBtn);
  inner.append(foot);
  createOverlay({
    className: "atv-comment-overlay",
    closeButton: closeBtn,
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
  const cardVoteBtns = new Map<string, VoteButtonElement>();
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

    const cardVoteBtn = buildVoteBtn({
      cid: c.cid,
      className: "atv-comment-votes",
      count: c.votes,
      onVote: async (cid) => {
        const result = await onVote(cid);
        if (result.ok && result.count !== undefined) {
          c.voted = true;
          c.votes = result.count;
        }
        return result;
      },
      voted: c.voted,
    });
    cardVoteBtns.set(c.cid, cardVoteBtn);
    footRight.append(expandBtn, cardVoteBtn);
    foot.append(footRight);
    card.append(foot);

    const showOverlay = (): void => {
      openCommentOverlay(c, onVote, cardVoteBtns);
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
