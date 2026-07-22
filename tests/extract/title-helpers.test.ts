/* ── H1 Extractors — Unit Tests ──────────────────────────── */
/* Tests extractH1 (DOM read) and extractYearFromH1 (pure string parse).
   These were moved out of resolve/context.ts so resolve/ stays DOM-free. */

import { describe, it, expect } from "vitest";

import {
  extractH1,
  extractYearFromH1,
} from "@/modules/subject/extract/title-helpers";

import { buildDoc } from "../helpers/doc";

describe(extractH1, () => {
  it("reads trimmed H1 text from #content h1", () => {
    const doc = buildDoc(
      "<html><body><div id='content'><h1>  肖申克的救赎 The Shawshank Redemption (1994)  </h1></div></body></html>"
    );
    expect(extractH1(doc)).toBe("肖申克的救赎 The Shawshank Redemption (1994)");
  });

  it("returns empty string when no H1 element is present", () => {
    const doc = buildDoc("<html><body><div id='content'></div></body></html>");
    expect(extractH1(doc)).toBe("");
  });

  it("returns empty string when #content is absent entirely", () => {
    const doc = buildDoc("<html><body></body></html>");
    expect(extractH1(doc)).toBe("");
  });
});

describe(extractYearFromH1, () => {
  it("extracts the trailing (YYYY) for movies", () => {
    expect(extractYearFromH1("Inception (2010)")).toBe("2010");
  });

  it("ignores a 4-digit run inside the title, not the trailing year", () => {
    expect(extractYearFromH1("Blade Runner 2049 (2017)")).toBe("2017");
  });

  it("ignores an early year when a trailing (YYYY) is present", () => {
    expect(extractYearFromH1("2001 A Space Odyssey (1968)")).toBe("1968");
  });

  it("returns undefined when there is no trailing year", () => {
    expect(extractYearFromH1("Inception")).toBeUndefined();
  });

  it("returns undefined for an empty H1", () => {
    expect(extractYearFromH1("")).toBeUndefined();
  });
});
