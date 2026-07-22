import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readStyle = (relativePath: string): string =>
  readFileSync(path.resolve(process.cwd(), relativePath), "utf-8");

const subjectStyle = (name: string) =>
  readStyle(`src/modules/subject/styles/${name}`);

const motionCss = subjectStyle("motion.css");
const heroActionsCss = subjectStyle("hero-actions.css");
const heroCss = subjectStyle("hero.css");
const detailsCss = subjectStyle("details.css");
const discussionsCss = subjectStyle("discussions.css");
const layoutCss = readStyle("src/shared/styles/layout.css");
const mediaCss = subjectStyle("media.css");
const mediaPlaybackCss = subjectStyle("media-playback.css");
const modalsCss = readStyle("src/shared/styles/modals.css");
const personageCss = [
  "hero.css",
  "collaborators.css",
  "gallery.css",
  "works.css",
  "timeline.css",
  "awards.css",
  "responsive.css",
]
  .map((name) => readStyle(`src/modules/personage/styles/${name}`))
  .join("\n");
const reviewsCss = subjectStyle("reviews.css");
const responsiveCss = subjectStyle("responsive.css");
const tokensCss = readStyle("src/shared/styles/tokens.css");

describe("motion style contract", () => {
  it("keeps principal browsing-card hover feedback spatially still", () => {
    expect(motionCss).not.toContain(".atv-poster-card:hover {\n    transform:");
    expect(motionCss).not.toMatch(
      /\.atv-comment-card:hover\s*\{[^}]*transform:/su
    );
    expect(mediaCss).not.toContain(".atv-series-card:hover,");
    expect(mediaPlaybackCss).not.toContain(".atv-trailer-tile:hover {");
  });

  it("uses one interaction contract for every trigger that opens an image preview", () => {
    expect(motionCss).toContain(".atv-image-preview-trigger:focus-visible");
    expect(motionCss).toContain(
      ".atv-image-preview-trigger:hover {\n    box-shadow: 0 24px 64px rgb(0 0 0 / 56%);\n    transform: translateY(-3px);"
    );
    expect(motionCss).toContain(
      ".atv-image-preview-trigger:active {\n  transform: scale(0.97);"
    );
    expect(heroCss).not.toContain(".atv-poster-card:hover");
    expect(personageCss).not.toContain(".atv-personage-portrait-trigger:hover");
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

  it("starts child-list entrances only after their section has been revealed", () => {
    expect(detailsCss).toContain(
      ".atv-section-reveal.is-revealed .atv-info-grid > *"
    );
    expect(personageCss).toContain(
      ".atv-section-reveal.is-revealed .atv-personage-collaborator"
    );
    expect(personageCss).toContain(
      ".atv-section-reveal.is-revealed .atv-personage-gallery-rail li"
    );
    expect(personageCss).toContain(
      ".atv-section-reveal.is-revealed .atv-timeline-card"
    );
  });

  it("caps grouped section entrances to a short shared sequence", () => {
    expect(personageCss).toContain(
      ".atv-section-reveal.is-revealed .atv-timeline-year-num"
    );
    expect(detailsCss).toContain(
      "animation: atv-info-row-enter 180ms var(--atv-ease-out) both;"
    );
  });

  it("limits translational hover feedback to fine-pointer devices", () => {
    expect(layoutCss).toContain(
      "@media (hover: hover) and (pointer: fine) {\n  .atv-section-more:hover"
    );
    expect(discussionsCss).toContain(
      "@media (hover: hover) and (pointer: fine) {\n  .atv-discussion-footer a:hover"
    );
    expect(discussionsCss).toContain(
      ".atv-discussion-row:hover .atv-discussion-title"
    );
  });

  it("crossfades the full-resolution image once it is ready", () => {
    expect(modalsCss).toContain(
      ".atv-modal-img {\n  max-width: 90vw;\n  max-height: 90vh;\n  border-radius: var(--atv-radius-lg);\n  box-shadow: 0 40px 80px rgb(0 0 0 / 75%);\n  object-fit: contain;\n  transition: opacity var(--atv-duration-feedback) ease;"
    );
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

  it("keeps static-photo geometry stable", () => {
    expect(mediaCss).toContain("flex: 0 0 auto;");
    expect(mediaCss).toContain("height: 225px;");
    expect(mediaCss).toContain(
      "aspect-ratio: var(--atv-photo-aspect-ratio, 16 / 9);"
    );
    expect(mediaCss).toContain("object-fit: contain;");
    expect(mediaCss).toContain(".atv-photo-rail-reserve");
  });

  it("keeps photo entrance motion off the hoverable trigger", () => {
    expect(mediaCss).toContain(
      ".atv-photo-tile-content {\n  display: block;\n  width: 100%;\n  height: 100%;\n  animation: atv-photo-in"
    );
    expect(mediaCss).not.toContain(
      ".atv-photo-tile {\n  display: flex;\n  overflow: hidden;\n  height: 225px;\n  flex: 0 0 auto;\n  padding: 0;\n  border: none;\n  border-radius: var(--atv-radius-md);\n  animation:"
    );
    expect(personageCss).not.toContain("border: 1px solid transparent;");
  });

  it("removes post-load portrait mutation without adding arrival motion", () => {
    expect(mediaCss).not.toContain(".atv-photo-tile.is-portrait");
    expect(responsiveCss).toContain(
      ".atv-photo-tile:not(.atv-trailer-tile),\n  .atv-photo-rail-reserve {\n    height: 157.5px;"
    );
    expect(responsiveCss).toContain(
      ".atv-trailer-tile {\n    height: 157.5px;\n    flex-basis: 280px;"
    );
    expect(responsiveCss).not.toContain(".atv-photo-tile.is-portrait");
    expect(mediaCss).toContain("@keyframes atv-photo-in");
  });
});
