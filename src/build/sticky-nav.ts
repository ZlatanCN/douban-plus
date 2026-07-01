/* ── Sticky Navigation Builder ────────────────────────── */

import { el } from "../components";
import type { StickyNavData } from "../types";

const buildStickyNav = (data: StickyNavData): HTMLElement => {
  const nav = el("nav", { className: "atv-stickynav" });

  nav.append(
    el("div", {
      className: "atv-stickynav-title",
      text: data.title.primary || data.title.full,
    })
  );

  const wrap = el("div", { className: "atv-stickynav-jumps" });
  for (const j of data.sections) {
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
