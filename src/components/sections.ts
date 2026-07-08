/* ── Section Header Builders ──────────────────────────── */

import { el } from "./dom-factory";

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

type BuildSectionOptions = {
  moreLink?: { text: string; href: string };
};

const buildSection = (
  id: string,
  headerText: string,
  content: HTMLElement,
  options?: BuildSectionOptions
): HTMLElement => {
  const sec = el("section", { className: "atv-section", id });
  if (options?.moreLink) {
    sec.append(
      buildSectionHeaderRow(
        headerText,
        options.moreLink.text,
        options.moreLink.href
      )
    );
  } else {
    sec.append(buildSectionHeader(headerText));
  }
  sec.append(content);
  return sec;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildSection, buildSectionHeader, buildSectionHeaderRow };
export type { BuildSectionOptions };
