/* ── Section Header Builders ──────────────────────────── */

import { el } from "../components/dom-factory";

function buildSectionHeader(text: string): HTMLHeadingElement {
  return el("h2", { className: "atv-section-h", text });
}

function buildSectionHeaderRow(
  text: string,
  moreText: string,
  moreHref: string
): HTMLDivElement {
  const row = el("div", { className: "atv-section-h-row" });
  row.appendChild(buildSectionHeader(text));
  if (moreText && moreHref) {
    row.appendChild(
      el("a", {
        className: "atv-section-more",
        text: moreText,
        href: moreHref,
        target: "_blank",
        rel: "noopener",
      })
    );
  }
  return row;
}

/* ── Exports ──────────────────────────────────────────── */

export { buildSectionHeader, buildSectionHeaderRow };
