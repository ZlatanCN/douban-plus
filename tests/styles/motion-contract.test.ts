import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readStyle = (name: string): string =>
  readFileSync(path.resolve(process.cwd(), "src/styles", name), "utf-8");

const motionCss = readStyle("motion.css");
const heroActionsCss = readStyle("hero-actions.css");
const heroCss = readStyle("hero.css");
const mediaCss = readStyle("media.css");
const mediaPlaybackCss = readStyle("media-playback.css");
const modalsCss = readStyle("modals.css");
const reviewsCss = readStyle("reviews.css");
const tokensCss = readStyle("00-tokens.css");

describe("motion style contract", () => {
  it("keeps principal browsing-card hover feedback spatially still", () => {
    expect(motionCss).not.toContain(".atv-poster-card:hover {\n    transform:");
    expect(motionCss).not.toMatch(
      /\.atv-comment-card:hover\s*\{[^}]*transform:/su
    );
    expect(mediaCss).not.toContain(".atv-series-card:hover,");
    expect(mediaPlaybackCss).not.toContain(".atv-trailer-tile:hover {");
  });

  it("uses shared fast movement values for review read-more and the hero chevron", () => {
    expect(reviewsCss).toContain(
      "opacity var(--atv-duration-hover) var(--atv-ease-out)"
    );
    expect(heroActionsCss).toContain(
      "transition: transform var(--atv-duration-hover) var(--atv-ease-in-out)"
    );
  });

  it("limits rank-label motion to fine-pointer hover and keeps keyboard focus still", () => {
    expect(heroCss).toContain("@media (hover: hover) and (pointer: fine)");
    expect(heroCss).toContain(
      ".atv-rank-label:hover .atv-rank-label-arrow {\n    color: var(--atv-text-primary);\n    transform: translateX(3px);"
    );
    expect(heroCss).not.toContain(
      ".atv-rank-label:focus-visible .atv-rank-label-arrow {\n  color: var(--atv-text-primary);\n  transform: translateX(3px);"
    );
  });

  it("keeps rank-label interaction feedback in the gold collection palette", () => {
    expect(heroCss).toContain(
      ".atv-rank-label:hover .atv-rank-label-entry,\n.atv-rank-label:focus-visible .atv-rank-label-entry {\n  border-left-color: #ffd166;"
    );
    expect(heroCss).not.toContain(
      ".atv-rank-label:hover .atv-rank-label-entry,\n.atv-rank-label:focus-visible .atv-rank-label-entry {\n  border-left-color: var(--atv-accent-bright);"
    );
  });

  it("gives modal close controls composited press feedback", () => {
    expect(modalsCss).toContain(
      "transform var(--atv-duration-press) var(--atv-ease-out)"
    );
    expect(modalsCss).toContain(".atv-modal-close:active");
    expect(modalsCss).toContain("transform: scale(0.97)");
  });

  it("does not interpolate hero button shadows", () => {
    expect(heroActionsCss).not.toContain("box-shadow 200ms");
  });

  it("centralizes feedback and content timing", () => {
    expect(tokensCss).toContain("--atv-duration-feedback: 200ms");
    expect(tokensCss).toContain("--atv-duration-content: 300ms");
  });

  it("leaves external rating panel lifecycle to its Motion controller", () => {
    expect(motionCss).not.toContain("atv-rating-panel-imdb.is-exiting");
    expect(motionCss).not.toContain("atv-rating-panel-rt.is-exiting");
  });

  it("does not define the unused atv-content-fade keyframe", () => {
    expect(motionCss).not.toContain("atv-content-fade");
  });
});
