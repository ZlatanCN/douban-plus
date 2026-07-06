/* ── Streaming Section Builder ───────────────────────── */

import { el } from "../components";
import { buildSection } from "../components/sections";
import { ICON_ARROW } from "../constants";
import type { Streaming } from "../types";

const buildStreaming = (streaming: Streaming[]): HTMLElement | null => {
  if (!streaming?.length) {
    return null;
  }
  const row = el("div", { className: "atv-stream-row" });
  for (const s of streaming) {
    const card = el("a", {
      className: "atv-stream-card",
      href: s.href,
      rel: "noopener",
      target: "_blank",
    });
    card.append(el("span", { text: s.name }));
    card.append(
      el("span", { className: "atv-stream-arrow", html: ICON_ARROW })
    );
    row.append(card);
  }
  return buildSection("atv-stream", "在哪儿看", row);
};

/* ── Exports ──────────────────────────────────────────── */

export { buildStreaming };
