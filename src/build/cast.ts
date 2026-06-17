import { el } from "../components/dom-factory";
import type { DoubanData } from "../types";
import { buildSectionHeader } from "./sections";

/* ── buildCast ────────────────────────────────────────── */

function buildCast(data: DoubanData): HTMLElement | null {
  if (!data.celebrities?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-cast" });
  sec.appendChild(buildSectionHeader("演职员"));
  const carousel = el("div", { className: "atv-carousel" });
  for (const c of data.celebrities) {
    const card = el(c.link ? "a" : "div", {
      className: "atv-cast-card",
      href: c.link || undefined,
      target: c.link ? "_blank" : undefined,
      rel: c.link ? "noopener" : undefined,
    });
    const av = el("div", { className: "atv-cast-avatar" });
    if (c.avatar) {
      av.style.backgroundImage = `url("${encodeURI(c.avatar)}")`;
    }
    card.appendChild(av);
    card.appendChild(el("div", { className: "atv-cast-name", text: c.name }));
    if (c.role) {
      card.appendChild(
        el("div", { className: "atv-cast-role", text: c.role })
      );
    }
    carousel.appendChild(card);
  }
  sec.appendChild(carousel);
  return sec;
}

/* ── Exports ──────────────────────────────────────────── */

export { buildCast };
