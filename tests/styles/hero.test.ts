import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const heroCss = readFileSync(
  path.resolve(process.cwd(), "src/modules/subject/styles/hero.css"),
  "utf-8"
);

describe("hero rank-label typography", () => {
  it("makes the collection title easier to scan than its catalog number", () => {
    expect(heroCss).toContain(
      ".atv-rank-label-entry strong {\n  color: var(--atv-rating-gold);\n  font-family: var(--atv-font-mono);\n  font-size: var(--atv-type-caption-sm);"
    );
    expect(heroCss).toContain(
      ".atv-rank-label-entry strong {\n  color: var(--atv-rating-gold);\n  font-family: var(--atv-font-mono);\n  font-size: var(--atv-type-caption-sm);\n  font-variant-numeric: tabular-nums;\n  font-weight: var(--atv-font-weight-bold);"
    );
    expect(heroCss).toContain(
      ".atv-rank-label-title {\n  overflow: hidden;\n  color: var(--atv-text-secondary);\n  font-size: var(--atv-type-body-sm);\n  font-weight: var(--atv-font-weight-regular);"
    );
  });
});
