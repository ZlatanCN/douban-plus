import { describe, expect, it, vi } from "vitest";

import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";

import { buildDoc } from "../helpers/doc";

describe(installEnhancedRoot, () => {
  it("keeps the native document active when enhanced rendering fails", () => {
    const doc = buildDoc('<div id="wrapper">原生人物页</div>');
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      installEnhancedRoot(doc, () => {
        throw new Error("render failed");
      })
    ).toBeFalsy();
    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();
    expect(doc.querySelector("#wrapper")?.textContent).toBe("原生人物页");

    warn.mockRestore();
  });
});
