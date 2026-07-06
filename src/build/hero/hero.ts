import { el } from "../../components";
import type { HeroData, HeroCallbacks } from "../../types";
import { buildRatingPanel } from "../rating-panels";
import { buildActions } from "./hero-actions";
import { buildHeroBg } from "./hero-bg";
import { buildMeta } from "./hero-meta";
import { buildPosterCard } from "./hero-poster";
import { buildSummary } from "./hero-summary";

/* ── buildHero — full hero banner orchestrator ────────── */

const buildHero = (data: HeroData, callbacks: HeroCallbacks): HTMLElement => {
  const hero = el("section", { className: "atv-hero" });

  hero.append(buildHeroBg(data));
  hero.append(el("div", { className: "atv-hero-vignette" }));
  hero.append(el("div", { className: "atv-hero-overlay-x" }));
  hero.append(el("div", { className: "atv-hero-overlay-y" }));

  const innerSection = el("div", { className: "atv-hero-inner-section" });
  const inner = el("div", { className: "atv-hero-inner" });

  inner.append(buildPosterCard(data));

  const info = el("div", { className: "atv-hero-info" });

  const title = el("h1", {
    className: "atv-hero-title",
    text: data.title.primary || data.title.full,
  });
  info.append(title);
  if (data.title.original) {
    info.append(
      el("div", { className: "atv-hero-orig", text: data.title.original })
    );
  }

  info.append(buildMeta(data));
  const panel = buildRatingPanel(data.rating, data.imdbId);
  if (panel) {
    info.append(panel);
  }

  info.append(buildActions(data.interest, callbacks));

  const summary = buildSummary(data.summary);
  if (summary) {
    info.append(summary);
  }

  inner.append(info);
  innerSection.append(inner);
  hero.append(innerSection);

  return hero;
};

export { buildHero };
