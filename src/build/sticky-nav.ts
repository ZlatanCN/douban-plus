/* ── Sticky Navigation Builder ────────────────────────── */

import { el } from "../components/dom-factory";
import type { DoubanData } from "../types";

const buildStickyNav = (data: DoubanData): HTMLElement => {
  const nav = el("nav", { className: "atv-stickynav" });

  nav.append(
    el("div", {
      className: "atv-stickynav-title",
      text: data.title.primary || data.title.full,
    })
  );

  const jumps: { id: string; label: string }[] = [];

  // Conditional sections — matches original render() order
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
  // Details is always present
  jumps.push({ id: "atv-info", label: "详情" });

  const wrap = el("div", { className: "atv-stickynav-jumps" });
  for (const j of jumps) {
    const a = el("a", { href: `#${j.id}`, text: j.label });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const t = document.querySelector(`#${j.id}`);
      if (t) {
        t.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    wrap.append(a);
  }
  nav.append(wrap);

  return nav;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildStickyNav };
