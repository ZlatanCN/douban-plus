import { afterEach, describe, expect, it, vi } from "vitest";

import {
  StickyNav,
  computeIndicatorMetrics,
} from "@/components/layout/sticky-nav";
import type { StickyNavData } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const rect = (left: number, width: number): DOMRectReadOnly =>
  ({
    bottom: 0,
    height: 0,
    left,
    right: left + width,
    toJSON: () => ({}),
    top: 0,
    width,
    x: left,
    y: 0,
  }) as DOMRectReadOnly;

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

const makeProps = (overrides?: Partial<StickyNavData>) => {
  const data = makeData(overrides);
  return {
    sections: data.sections,
    title: data.title.primary || data.title.full,
  };
};

const noop = (): undefined => undefined;

describe(StickyNav, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the title from data.title.primary", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "肖申克的救赎"
    );
  });

  it("falls back to data.title.full when primary is empty", () => {
    const root = renderIntoRoot(
      <StickyNav
        {...makeProps({
          title: { full: "Fallback Title", primary: "" },
        })}
        onJump={noop}
      />
    );
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "Fallback Title"
    );
  });

  it("renders each section link with href and label", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
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
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    const links = root.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links[2].textContent).toBe("短评");
    expect(links[2].getAttribute("href")).toBe("#atv-comments");
  });

  it("renders no section links when sections array is empty", () => {
    const root = renderIntoRoot(
      <StickyNav {...makeProps({ sections: [] })} onJump={noop} />
    );
    expect(root.querySelectorAll(".atv-stickynav-jumps a")).toHaveLength(0);
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "肖申克的救赎"
    );
  });

  it("prevents default and forwards jump link clicks", () => {
    const onJump = vi.fn<(sectionId: string) => void>();
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={onJump} />);
    const link = root.querySelector<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    link?.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTruthy();
    expect(onJump).toHaveBeenCalledWith("atv-cast");
  });

  it("renders a single sliding marker element", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    const marker = root.querySelector(".atv-stickynav-marker");
    expect(marker).not.toBeNull();
    expect(root.querySelectorAll(".atv-stickynav-marker")).toHaveLength(1);
  });

  it("tags each jump link with its section id for marker measurement", () => {
    const root = renderIntoRoot(<StickyNav {...makeProps()} onJump={noop} />);
    const links = root.querySelectorAll<HTMLAnchorElement>(
      ".atv-stickynav-jumps a"
    );
    expect(links[0].dataset.sectionId).toBe("atv-cast");
    expect(links[1].dataset.sectionId).toBe("atv-photos");
  });

  describe("sliding-marker indicator metrics", () => {
    it("measures the active link offset and width relative to its container", () => {
      const container = document.createElement("div");
      const link = document.createElement("a");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
        rect(100, 500)
      );
      vi.spyOn(link, "getBoundingClientRect").mockReturnValue(rect(250, 80));

      expect(computeIndicatorMetrics(link, container)).toStrictEqual({
        left: 150,
        width: 80,
      });
    });

    it("returns a zero offset when the link starts at the container's left edge", () => {
      const container = document.createElement("div");
      const link = document.createElement("a");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
        rect(0, 500)
      );
      vi.spyOn(link, "getBoundingClientRect").mockReturnValue(rect(0, 64));

      expect(computeIndicatorMetrics(link, container)).toStrictEqual({
        left: 0,
        width: 64,
      });
    });
  });

  it("positions the sliding marker over the active link", () => {
    const navRef = { current: null as HTMLElement | null };
    const rafState: { callback: ((time: number) => void) | null } = {
      callback: null,
    };
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: (time: number) => void): number => {
        rafState.callback = callback;
        return 0;
      }
    );
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((): void => {});
    /* eslint-enable promise/prefer-await-to-callbacks */

    const root = renderIntoRoot(
      <StickyNav
        {...makeProps()}
        activeSectionId="atv-cast"
        navRef={navRef}
        onJump={noop}
      />
    );

    const jumps = root.querySelector<HTMLElement>(
      ".atv-stickynav-jumps"
    ) as HTMLElement;
    const activeLink = root.querySelector<HTMLElement>(
      '[data-section-id="atv-cast"]'
    ) as HTMLElement;
    const marker = root.querySelector<HTMLElement>(
      ".atv-stickynav-marker"
    ) as HTMLElement;
    expect(marker).not.toBeNull();

    vi.spyOn(jumps, "getBoundingClientRect").mockReturnValue(rect(0, 500));
    vi.spyOn(activeLink, "getBoundingClientRect").mockReturnValue(
      rect(120, 90)
    );

    rafState.callback?.(0);

    expect(marker.style.transform).toBe("translateX(120px)");
    expect(marker.style.width).toBe("90px");
  });
});
