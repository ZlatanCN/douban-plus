/* ── buildStickyNav — Unit Tests ───────────────────────────── */
/* Tests the sticky navigation bar builder.                       */

import { describe, it, expect } from "vitest";

import { buildStickyNav } from "../../src/build/sticky-nav";
import type { StickyNavData } from "../../src/types";

/* ── Helpers ────────────────────────────────────────────────── */

const makeData = (overrides?: Partial<StickyNavData>): StickyNavData => ({
  sections: [
    { id: "atv-cast", label: "演职员" },
    { id: "atv-photos", label: "剧照" },
    { id: "atv-comments", label: "短评" },
  ],
  title: {
    full: "肖申克的救赎 / The Shawshank Redemption",
    primary: "肖申克的救赎",
  },
  ...overrides,
});

/* ── Tests ──────────────────────────────────────────────────── */

describe("buildStickyNav", () => {
  it("returns a <nav> element with class atv-stickynav", () => {
    const nav = buildStickyNav(makeData());
    expect(nav.tagName).toBe("NAV");
    expect(nav.classList.contains("atv-stickynav")).toBe(true);
  });

  it("renders the title from data.title.primary", () => {
    const nav = buildStickyNav(makeData());
    const titleEl = nav.querySelector<HTMLElement>(".atv-stickynav-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("肖申克的救赎");
  });

  it("falls back to data.title.full when primary is empty", () => {
    const data = makeData({ title: { full: "Fallback Title", primary: "" } });
    const nav = buildStickyNav(data);
    const titleEl = nav.querySelector<HTMLElement>(".atv-stickynav-title");
    expect(titleEl?.textContent).toBe("Fallback Title");
  });

  it("renders each section as an <a> with href and label", () => {
    const nav = buildStickyNav(makeData());
    const links = nav.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links).toHaveLength(3);

    expect(links[0].textContent).toBe("演职员");
    expect(links[0].getAttribute("href")).toBe("#atv-cast");

    expect(links[1].textContent).toBe("剧照");
    expect(links[1].getAttribute("href")).toBe("#atv-photos");

    expect(links[2].textContent).toBe("短评");
    expect(links[2].getAttribute("href")).toBe("#atv-comments");
  });

  it("renders correct number of links for multiple sections", () => {
    const data = makeData({
      sections: [
        { id: "s1", label: "One" },
        { id: "s2", label: "Two" },
        { id: "s3", label: "Three" },
        { id: "s4", label: "Four" },
        { id: "s5", label: "Five" },
      ],
    });
    const nav = buildStickyNav(data);
    const links = nav.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links).toHaveLength(5);
  });

  it("renders no section links when sections array is empty", () => {
    const data = makeData({ sections: [] });
    const nav = buildStickyNav(data);
    const links = nav.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links).toHaveLength(0);

    // Title should still be present
    const titleEl = nav.querySelector<HTMLElement>(".atv-stickynav-title");
    expect(titleEl?.textContent).toBe("肖申克的救赎");
  });

  it("gives each link an href in #sectionId format", () => {
    const nav = buildStickyNav(makeData());
    const links = nav.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    for (const link of links) {
      const href = link.getAttribute("href");
      expect(href).toMatch(/^#.+$/u);
      expect(href?.startsWith("#")).toBe(true);
    }
  });

  it("contains exactly two direct children: title and jumps wrapper", () => {
    const nav = buildStickyNav(makeData());
    // Two direct children: .atv-stickynav-title + .atv-stickynav-jumps
    expect(nav.children).toHaveLength(2);
    expect(nav.children[0].className).toBe("atv-stickynav-title");
    expect(nav.children[1].className).toBe("atv-stickynav-jumps");
  });

  it("jumps wrapper contains only section links (no extra children)", () => {
    const nav = buildStickyNav(makeData());
    const wrap = nav.querySelector<HTMLElement>(".atv-stickynav-jumps");
    expect(wrap).not.toBeNull();

    const children = [...(wrap?.children ?? [])];
    expect(children).toHaveLength(3);
    for (const child of children) {
      expect(child.tagName).toBe("A");
    }
  });

  it("each link's click handler calls preventDefault", () => {
    const nav = buildStickyNav(makeData());
    const link = nav.querySelector<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    ) as HTMLAnchorElement;

    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
