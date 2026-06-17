/* ── Section Header Builders ──────────────────────────── */

import { el } from "../components/dom-factory";

const buildSectionHeader = (text: string): HTMLHeadingElement =>
  el("h2", { className: "atv-section-h", text });

const buildSectionHeaderRow = (
  text: string,
  moreText: string,
  moreHref: string
): HTMLDivElement => {
  const row = el("div", { className: "atv-section-h-row" });
  row.append(buildSectionHeader(text));
  if (moreText && moreHref) {
    row.append(
      el("a", {
        className: "atv-section-more",
        href: moreHref,
        rel: "noopener",
        target: "_blank",
        text: moreText,
      })
    );
  }
  return row;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildSectionHeader, buildSectionHeaderRow };
