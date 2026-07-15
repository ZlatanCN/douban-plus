import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const stickyNavCss = readFileSync(
  path.resolve(process.cwd(), "src/styles/sticky-nav.css"),
  "utf-8"
);

describe("sticky navigation styles", () => {
  it("gives active link text enough specificity to override the root link reset", () => {
    expect(stickyNavCss).toContain(
      "#atv-douban-root .atv-stickynav-jumps a.is-active"
    );
  });

  it("replaces the per-link underline with a single sliding marker", () => {
    expect(stickyNavCss).toContain(".atv-stickynav-marker");
    // The old per-item ::after underline must be gone.
    expect(stickyNavCss).not.toContain("a.is-active::after");
    // The marker slides using the shared feedback token, not `all`/`ease-in`.
    // The transition is split across lines by the formatter, so match with
    // whitespace tolerance rather than an exact single-line string.
    expect(stickyNavCss).toMatch(
      /transition:\s*transform var\(--atv-duration-feedback\) var\(--atv-ease-in-out\)/u
    );
    expect(stickyNavCss).toMatch(
      /width var\(--atv-duration-feedback\) var\(--atv-ease-in-out\)/u
    );
  });

  it("drops the marker's sliding transition under reduced motion", () => {
    expect(stickyNavCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(stickyNavCss).toContain(
      ".atv-stickynav-marker {\n    transition: none;"
    );
  });
});
