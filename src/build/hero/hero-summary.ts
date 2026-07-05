import { el } from "../../components";
import { ICON_CHEVRON } from "../../constants";

/* ── buildSummary — teaser with expand/collapse toggle ── */

const buildSummary = (text: string | null): HTMLElement | null => {
  if (!text) {
    return null;
  }

  const summary = el("div", { className: "atv-hero-summary" });

  const teaser = el("p", {
    className: "atv-hero-teaser is-clamped",
    text,
  });
  summary.append(teaser);

  const more = el("button", {
    attrs: { type: "button" },
    className: "atv-hero-more",
  });
  const moreLabel = el("span", { text: "展开" });
  more.append(moreLabel);
  more.append(el("span", { html: ICON_CHEVRON }));
  more.addEventListener("click", () => {
    const open = !teaser.classList.toggle("is-clamped");
    more.classList.toggle("is-open", open);
    moreLabel.textContent = open ? "收起" : "展开";
  });
  requestAnimationFrame(() => {
    const overflowing = teaser.scrollHeight - teaser.clientHeight > 4;
    if (!overflowing) {
      more.style.display = "none";
    }
  });
  summary.append(more);

  return summary;
};

export { buildSummary };
