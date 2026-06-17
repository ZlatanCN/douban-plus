/* ── Streaming Section Builder ───────────────────────── */

import { el } from "../components/dom-factory";
import { ICON_ARROW } from "../constants";
import type { Streaming } from "../types";
import { buildSectionHeader } from "./sections";

function buildStreaming(data: {
  streaming: Streaming[];
}): HTMLElement | null {
  if (!data.streaming?.length) {
    return null;
  }
  const sec = el("section", {
    className: "atv-section",
    id: "atv-stream",
  });
  sec.appendChild(buildSectionHeader("在哪儿看"));
  const row = el("div", { className: "atv-stream-row" });
  for (const s of data.streaming) {
    const card = el("a", {
      className: "atv-stream-card",
      href: s.href,
      target: "_blank",
      rel: "noopener",
    });
    card.appendChild(el("span", { text: s.name }));
    card.appendChild(
      el("span", { className: "atv-stream-arrow", html: ICON_ARROW })
    );
    row.appendChild(card);
  }
  sec.appendChild(row);
  return sec;
}

/* ── Exports ──────────────────────────────────────────── */

export { buildStreaming };
