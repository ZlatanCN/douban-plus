/* ── DOM Helpers — $, $$, safeText Tests ────────────────────── */
/* Tests query helpers injected with a document.                 */

import { describe, it, expect } from "vitest";

import { $, $$, safeText } from "../../src/utils/dom";
import { buildDoc } from "../helpers";

const HTML = `<!DOCTYPE html>
<html>
<body>
  <div id="app">
    <span class="item" data-id="1">First</span>
    <span class="item" data-id="2">Second</span>
    <span class="item hidden">Third</span>
    <div class="nested">
      <span class="deep">Deep</span>
    </div>
  </div>
  <p>  Paragraph with spaces  </p>
</body>
</html>`;

describe("$ (single element query)", () => {
  it("finds an element by selector", () => {
    const doc = buildDoc(HTML);
    const el = $("#app", doc);
    expect(el).not.toBeNull();
    expect(el?.id).toBe("app");
  });

  it("returns null for missing selector", () => {
    const doc = buildDoc(HTML);
    expect($("#nonexistent", doc)).toBeNull();
  });

  it("accepts a narrower context", () => {
    const doc = buildDoc(HTML);
    const app = $("#app", doc) as HTMLElement;
    const deep = $(".deep", app);
    expect(deep).not.toBeNull();
    expect(deep?.textContent).toBe("Deep");
  });

  it("returns null when searching in empty context", () => {
    const doc = buildDoc(HTML);
    const outer = $(".nested", doc) as HTMLElement;
    expect($("#app", outer)).toBeNull();
  });
});

describe("$$ (multiple element query)", () => {
  it("finds all matching elements", () => {
    const doc = buildDoc(HTML);
    const items = $$(".item", doc);
    expect(items).toHaveLength(3);
  });

  it("returns empty array for missing selector", () => {
    const doc = buildDoc(HTML);
    expect($$(".nonexistent", doc)).toEqual([]);
  });

  it("accepts a narrower context", () => {
    const doc = buildDoc(HTML);
    const nested = $(".nested", doc) as HTMLElement;
    const deep = $$(".deep", nested);
    expect(deep).toHaveLength(1);
  });

  it("returns typed elements", () => {
    const doc = buildDoc(HTML);
    const items = $$<HTMLSpanElement>(".item", doc);
    expect(items[0] instanceof HTMLSpanElement).toBe(true);
  });
});

describe("safeText", () => {
  it("returns trimmed text content", () => {
    const doc = buildDoc(HTML);
    const p = $("p", doc);
    expect(safeText(p)).toBe("Paragraph with spaces");
  });

  it("returns empty string for null", () => {
    expect(safeText(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    // oxlint-disable-next-line unicorn/no-useless-undefined
    expect(safeText(undefined)).toBe("");
  });

  it("returns text for element hidden by class", () => {
    const doc = buildDoc(HTML);
    const el = $("span.hidden", doc);
    expect(safeText(el)).toBe("Third");
  });
});
