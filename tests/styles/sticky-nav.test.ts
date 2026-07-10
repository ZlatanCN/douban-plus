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
});
