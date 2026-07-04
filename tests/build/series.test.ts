/* ── buildSeries — Unit Tests ────────────────────────────── */

import { describe, it, expect } from "vitest";

import { buildSeries } from "../../src/build";
import type { SeriesItem } from "../../src/types";

/* ── Factory helpers ─────────────────────────────────────── */

const makeItem = (overrides?: Partial<SeriesItem>): SeriesItem => ({
  link: "https://movie.douban.com/subject/1/",
  poster: "https://img1.doubanio.com/poster.jpg",
  rating: "9.5",
  title: "第一季",
  ...overrides,
});

/* ── Tests ─────────────────────────────────────────────────── */

describe("buildSeries", () => {
  /* ── Null/empty return ──────────────────────────────────── */

  it("returns null when items array is empty", () => {
    expect(buildSeries([])).toBeNull();
  });

  it("returns null when items is null/undefined", () => {
    expect(buildSeries(null as unknown as SeriesItem[])).toBeNull();
    expect(buildSeries(undefined as unknown as SeriesItem[])).toBeNull();
  });

  /* ── Section structure ─────────────────────────────────── */

  it("returns a section with class atv-section and id atv-series", () => {
    const section = buildSeries([makeItem()]) as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("atv-series");
    expect(section.classList.contains("atv-section")).toBe(true);
  });

  it("section has h2 header with 同系列作品 text", () => {
    const section = buildSeries([makeItem()]) as HTMLElement;
    const header = section.querySelector("h2.atv-section-h");
    expect(header?.textContent).toBe("同系列作品");
  });

  /* ── Card structure ───────────────────────────────────── */

  it("each item renders as card with poster img, title, rating", () => {
    const section = buildSeries([makeItem()]) as HTMLElement;
    const card = section.querySelector(".atv-series-card");
    expect(card).not.toBeNull();

    const poster = card?.querySelector(".atv-series-poster img");
    expect(poster).not.toBeNull();
    expect(poster?.getAttribute("src")).toContain("poster.jpg");

    const title = card?.querySelector(".atv-series-title");
    expect(title?.textContent).toBe("第一季");

    const badge = card?.querySelector(".atv-series-badge");
    expect(badge?.textContent).toBe("9.5");
  });

  it("card link has href, target, rel when link is provided", () => {
    const section = buildSeries([makeItem()]) as HTMLElement;
    const card = section.querySelector(".atv-series-card") as HTMLAnchorElement;
    expect(card.tagName).toBe("A");
    expect(card.href).toContain("/subject/1/");
    expect(card.target).toBe("_blank");
    expect(card.rel).toBe("noopener");
  });

  it("card does not wrap in a when link is empty", () => {
    const item = makeItem({ link: "" });
    const section = buildSeries([item]) as HTMLElement;
    const card = section.querySelector(".atv-series-card");
    expect(card?.tagName).not.toBe("A");
  });

  it("renders correct number of cards for multiple items", () => {
    const items = [
      makeItem({ title: "第一季" }),
      makeItem({ title: "第二季" }),
    ];
    const section = buildSeries(items) as HTMLElement;
    const cards = section.querySelectorAll(".atv-series-card");
    expect(cards.length).toBe(2);
  });

  /* ── Poster fallback ────────────────────────────────────── */

  it("shows placeholder when poster is missing", () => {
    const item = makeItem({ poster: "" });
    const section = buildSeries([item]) as HTMLElement;
    const placeholder = section.querySelector(".atv-poster-placeholder");
    expect(placeholder).not.toBeNull();
    expect(section.querySelector(".atv-series-poster img")).toBeNull();
  });

  /* ── Rating optional ───────────────────────────────────── */

  it("handles items without rating", () => {
    const item = makeItem({ rating: "" });
    const section = buildSeries([item]) as HTMLElement;
    expect(section.querySelector(".atv-series-badge")).toBeNull();
  });
});
