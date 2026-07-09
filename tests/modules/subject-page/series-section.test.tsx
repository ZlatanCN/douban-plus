import { describe, expect, it } from "vitest";

import { SeriesSection } from "@/modules/subject-page/media";
import type { SeriesItem } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const makeItem = (overrides?: Partial<SeriesItem>): SeriesItem => ({
  link: "https://movie.douban.com/subject/1/",
  poster: "https://img1.doubanio.com/poster.jpg",
  rating: "9.5",
  title: "第一季",
  ...overrides,
});

describe(SeriesSection, () => {
  it("renders nothing when items array is empty", () => {
    const root = renderIntoRoot(<SeriesSection items={[]} />);
    expect(root.firstElementChild).toBeNull();
  });

  it("renders section structure and header", () => {
    const root = renderIntoRoot(<SeriesSection items={[makeItem()]} />);
    const section = root.querySelector<HTMLElement>("#atv-series");
    expect(section?.tagName).toBe("SECTION");
    expect(section?.classList.contains("atv-section")).toBeTruthy();
    expect(section?.querySelector("h2.atv-section-h")?.textContent).toBe(
      "同系列作品"
    );
  });

  it("renders card with poster, title and external link attrs", () => {
    const root = renderIntoRoot(<SeriesSection items={[makeItem()]} />);
    const card = root.querySelector<HTMLAnchorElement>(".atv-series-card");
    expect(card?.tagName).toBe("A");
    expect(card?.href).toContain("/subject/1/");
    expect(card?.target).toBe("_blank");
    expect(card?.rel).toBe("noopener");
    expect(card?.querySelector(".atv-series-poster img")).not.toBeNull();
  });

  it("renders card with title and rating text", () => {
    const root = renderIntoRoot(<SeriesSection items={[makeItem()]} />);
    const card = root.querySelector<HTMLAnchorElement>(".atv-series-card");
    expect(card?.querySelector(".atv-series-title")?.textContent).toBe(
      "第一季"
    );
    expect(card?.querySelector(".atv-series-badge")?.textContent).toBe("9.5");
  });

  it("uses a non-anchor card when link is empty", () => {
    const root = renderIntoRoot(
      <SeriesSection items={[makeItem({ link: "" })]} />
    );
    expect(root.querySelector(".atv-series-card")?.tagName).not.toBe("A");
  });

  it("shows placeholder when poster is missing and omits empty rating", () => {
    const root = renderIntoRoot(
      <SeriesSection items={[makeItem({ poster: "", rating: "" })]} />
    );
    expect(root.querySelector(".atv-poster-placeholder")).not.toBeNull();
    expect(root.querySelector(".atv-series-badge")).toBeNull();
  });
});
