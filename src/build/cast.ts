import { el } from "../components";
import { buildSection } from "../components/sections";
import type { Celebrity } from "../types";

/* ── buildCast ────────────────────────────────────────── */

const buildCast = (celebrities: Celebrity[]): HTMLElement | null => {
  if (!celebrities?.length) {
    return null;
  }
  const carousel = el("div", { className: "atv-carousel atv-cast-carousel" });
  for (const c of celebrities) {
    const card = el(c.link ? "a" : "div", {
      className: "atv-cast-card",
      href: c.link || undefined,
      rel: c.link ? "noopener" : undefined,
      target: c.link ? "_blank" : undefined,
    });
    const av = el("div", { className: "atv-cast-avatar" });
    if (c.avatar) {
      av.style.backgroundImage = `url("${c.avatar}")`;
    }
    card.append(av);
    card.append(el("div", { className: "atv-cast-name", text: c.name }));
    if (c.role) {
      card.append(el("div", { className: "atv-cast-role", text: c.role }));
    }
    carousel.append(card);
  }
  return buildSection("atv-cast", "演职员", carousel);
};

/* ── Exports ──────────────────────────────────────────── */
export { buildCast };
