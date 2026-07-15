import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const heroCss = readFileSync(
  path.resolve(process.cwd(), "src/styles/hero.css"),
  "utf-8"
);

describe("hero rank-label typography", () => {
  it("makes the collection title easier to scan than its catalog number", () => {
    expect(heroCss).toContain(
      '.atv-rank-label-entry strong {\n  color: var(--atv-rating-gold);\n  font-family: ui-monospace, SFMono-Regular, "Cascadia Code", monospace;\n  font-size: 12px;'
    );
    expect(heroCss).toContain(
      '.atv-rank-label-entry strong {\n  color: var(--atv-rating-gold);\n  font-family: ui-monospace, SFMono-Regular, "Cascadia Code", monospace;\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n  font-weight: 700;'
    );
    expect(heroCss).toContain(
      ".atv-rank-label-title {\n  overflow: hidden;\n  color: var(--atv-text-secondary);\n  font-size: 14px;\n  font-weight: 400;"
    );
  });
});
