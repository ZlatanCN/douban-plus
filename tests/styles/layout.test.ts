import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const layoutCss = readFileSync(
  path.resolve(process.cwd(), "src/styles/layout.css"),
  "utf-8"
);

describe("section reveal styles", () => {
  it("starts a reveal section offset and transparent", () => {
    expect(layoutCss).toContain(".atv-section-reveal {");
    expect(layoutCss).toContain("opacity: 0;");
    expect(layoutCss).toContain("transform: translateY(12px);");
  });

  it("animates only opacity and transform with the content duration token", () => {
    expect(layoutCss).toContain(".atv-section-reveal.is-revealed {");
    expect(layoutCss).toContain(
      "var(--atv-duration-content) var(--atv-ease-out)"
    );
    expect(layoutCss).not.toContain("transition: all");
    expect(layoutCss).not.toContain("ease-in");
  });

  it("shows the section without motion under reduced-motion preference", () => {
    expect(layoutCss).toContain("prefers-reduced-motion: reduce");
    expect(layoutCss).toContain("transition: none;");
  });
});

describe("carousel scroll-snap", () => {
  it("allows free scrolling without snap-back on small gestures", () => {
    expect(layoutCss).toContain(".atv-carousel {");
    expect(layoutCss).not.toMatch(/scroll-snap-type/u);
  });
});
