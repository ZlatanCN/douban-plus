import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readStyle = (file: string): string =>
  readFileSync(path.resolve(process.cwd(), file), "utf-8");

const reviewsCss = readStyle("src/modules/subject/styles/reviews.css");
const responsiveCss = readStyle("src/modules/subject/styles/responsive.css");
const motionCss = readStyle("src/modules/subject/styles/motion.css");

describe("review reader scroll styles", () => {
  it("pins the green accent to the panel edge without shifting the reader content", () => {
    const desktopPanelRule = reviewsCss.match(
      /\.atv-review-modal-scroll\s*\{([^}]+)\}/u
    )?.[1];
    const accentRule = reviewsCss.match(
      /\.atv-review-modal-scroll::before\s*\{([^}]+)\}/u
    )?.[1];

    expect(desktopPanelRule).toMatch(/padding:\s*0 56px 32px;/u);
    expect(accentRule).toMatch(/position:\s*sticky;/u);
    expect(accentRule).toMatch(/top:\s*0;/u);
    expect(accentRule).toMatch(/height:\s*3px;/u);
    expect(accentRule).toMatch(/margin:\s*0 -56px 45px;/u);
    expect(responsiveCss).toMatch(/padding:\s*0 18px 22px;/u);
    expect(responsiveCss).toMatch(/margin:\s*0 -18px 21px;/u);
    expect(motionCss).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.atv-review-modal-scroll::before\s*\{[^}]*opacity:\s*1;/u
    );
  });
});
