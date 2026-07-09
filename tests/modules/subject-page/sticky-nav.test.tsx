import { describe, expect, it } from "vitest";

import { StickyNav } from "@/components/layout/sticky-nav";
import type { StickyNavData } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

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

describe(StickyNav, () => {
  it("renders the title from data.title.primary", () => {
    const root = renderIntoRoot(<StickyNav {...makeData()} />);
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "肖申克的救赎"
    );
  });

  it("falls back to data.title.full when primary is empty", () => {
    const root = renderIntoRoot(
      <StickyNav
        {...makeData({
          title: { full: "Fallback Title", primary: "" },
        })}
      />
    );
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "Fallback Title"
    );
  });

  it("renders each section link with href and label", () => {
    const root = renderIntoRoot(<StickyNav {...makeData()} />);
    const links = root.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links).toHaveLength(3);
    expect(links[0].textContent).toBe("演职员");
    expect(links[0].getAttribute("href")).toBe("#atv-cast");
    expect(links[1].textContent).toBe("剧照");
    expect(links[1].getAttribute("href")).toBe("#atv-photos");
  });

  it("renders third section link with label and href", () => {
    const root = renderIntoRoot(<StickyNav {...makeData()} />);
    const links = root.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links[2].textContent).toBe("短评");
    expect(links[2].getAttribute("href")).toBe("#atv-comments");
  });

  it("renders no section links when sections array is empty", () => {
    const root = renderIntoRoot(<StickyNav {...makeData({ sections: [] })} />);
    expect(root.querySelectorAll(".atv-stickynav-jumps a")).toHaveLength(0);
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "肖申克的救赎"
    );
  });

  it("prevents default on jump link clicks", () => {
    const root = renderIntoRoot(<StickyNav {...makeData()} />);
    const link = root.querySelector<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    link?.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTruthy();
  });
});
