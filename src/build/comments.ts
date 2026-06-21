import { el, renderStars } from "../components";
import { ICON_THUMB } from "../constants";
import type { DoubanData } from "../types";
import { buildSectionHeaderRow } from "./sections";

/* ── buildComments ────────────────────────────────────── */

/**
 * Callback invoked when a user votes on a comment.
 * Returns updated count on success, or { ok: false } on failure for rollback.
 */
type VoteCallback = (cid: string) => Promise<{ ok: boolean; count?: number }>;

const buildComments = (
  data: DoubanData,
  onVote: VoteCallback
): HTMLElement | null => {
  if (!data.comments?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-comments" });
  const allHref = data.subjectId
    ? `https://movie.douban.com/subject/${data.subjectId}/comments?status=P`
    : "";
  sec.append(
    buildSectionHeaderRow("热门短评", allHref ? "查看全部 →" : "", allHref)
  );
  const grid = el("div", { className: "atv-comments" });
  for (const c of data.comments) {
    const card = el("div", { className: "atv-comment-card" });

    const top = el("div", { className: "atv-comment-top" });
    const avatar = el("div", { className: "atv-comment-avatar" });
    if (c.avatar) {
      avatar.style.backgroundImage = `url("${encodeURI(c.avatar)}")`;
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

    card.append(el("div", { className: "atv-comment-body", text: c.content }));

    const foot = el("div", { className: "atv-comment-foot" });
    foot.append(el("span", { text: c.time || "" }));

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
    foot.append(voteBtn);
    card.append(foot);

    grid.append(card);
  }
  sec.append(grid);
  return sec;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildComments };
