/* ── Streaming Section Builder ───────────────────────── */

import { el } from "../components/dom-factory";
import { ICON_ARROW } from "../constants";
import type { Streaming } from "../types";
import { buildSectionHeader } from "./sections";

const buildStreaming = (data: {
  streaming: Streaming[];
}): HTMLElement | null => {
  if (!data.streaming?.length) {
    return null;
  }
  const sec = el("section", {
    className: "atv-section",
    id: "atv-stream",
  });
  sec.append(buildSectionHeader("在哪儿看"));
  const row = el("div", { className: "atv-stream-row" });
  for (const s of data.streaming) {
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
  sec.append(row);
  return sec;
};

/* ── Exports ──────────────────────────────────────────── */

export { buildStreaming };
