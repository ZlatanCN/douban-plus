import { el, renderStars } from "../components/dom-factory";
import { ICON_THUMB } from "../constants";
import type { DoubanData } from "../types";
import { buildSectionHeaderRow } from "./sections";

/* ── buildComments ────────────────────────────────────── */

function buildComments(data: DoubanData): HTMLElement | null {
  if (!data.comments?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-comments" });
  const allHref = data.subjectId
    ? "https://movie.douban.com/subject/" +
      data.subjectId +
      "/comments?status=P"
    : "";
  sec.appendChild(
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
    top.appendChild(avatar);

    const metaCol = el("div", { className: "atv-comment-meta" });
    const author = el(c.link ? "a" : "div", {
      className: "atv-comment-author",
      text: c.name,
      href: c.link || undefined,
      target: c.link ? "_blank" : undefined,
      rel: c.link ? "noopener" : undefined,
    });
    metaCol.appendChild(author);
    if (c.stars > 0) {
      metaCol.appendChild(
        renderStars(c.stars, {
          outOfFive: true,
          className: "atv-comment-stars",
        })
      );
    }
    top.appendChild(metaCol);
    card.appendChild(top);

    card.appendChild(
      el("div", { className: "atv-comment-body", text: c.content })
    );

    const foot = el("div", { className: "atv-comment-foot" });
    foot.appendChild(el("span", { text: c.time || "" }));
    if (c.votes > 0) {
      const votes = el("span", { className: "atv-comment-votes" });
      votes.appendChild(
        el("span", { className: "atv-stream-arrow", html: ICON_THUMB })
      );
      votes.appendChild(
        el("span", { text: c.votes.toLocaleString("en-US") })
      );
      foot.appendChild(votes);
    }
    card.appendChild(foot);

    grid.appendChild(card);
  }
  sec.appendChild(grid);
  return sec;
}

/* ── Exports ──────────────────────────────────────────── */

export { buildComments };
