/* ── Sticky Navigation Builder ────────────────────────── */

import { el } from "../components/dom-factory";
import { ICON_CHEVRON } from "../constants";
import type { DoubanData } from "../types";

function buildStickyNav(data: DoubanData): HTMLElement {
  const nav = el("nav", { className: "atv-stickynav" });

  nav.appendChild(
    el("div", {
      className: "atv-stickynav-title",
      text: data.title.primary || data.title.full,
    })
  );

  const jumps: Array<{ id: string; label: string }> = [];

  // Always-present sections
  jumps.push({ id: "atv-hero", label: "概览" });
  jumps.push({ id: "atv-info", label: "详情" });

  // Conditional sections
  if (data.streaming.length > 0) {
    jumps.push({ id: "atv-stream", label: "在哪儿看" });
  }
  if (data.celebrities.length > 0) {
    jumps.push({ id: "atv-cast", label: "演职员" });
  }
  if (data.photos.length > 0) {
    jumps.push({ id: "atv-photos", label: "剧照" });
  }
  if (data.comments.length > 0) {
    jumps.push({ id: "atv-comments", label: "短评" });
  }
  if (data.recommendations.length > 0) {
    jumps.push({ id: "atv-recs", label: "相似作品" });
  }

  const wrap = el("div", { className: "atv-stickynav-jumps" });
  for (const j of jumps) {
    const a = el("a", { href: `#${j.id}`, text: j.label });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const t = document.getElementById(j.id);
      if (t) {
        t.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    wrap.appendChild(a);
  }
  // Chevron indicator at end of jump links
  wrap.appendChild(el("span", { html: ICON_CHEVRON }));
  nav.appendChild(wrap);

  return nav;
}

/* ── Exports ──────────────────────────────────────────── */

export { buildStickyNav };
