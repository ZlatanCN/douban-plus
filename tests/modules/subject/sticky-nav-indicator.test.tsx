import { afterEach, describe, expect, it, vi } from "vitest";

import {
  StickyNav,
  computeIndicatorMetrics,
} from "@/shared/components/layout/sticky-nav";

import { renderIntoRoot } from "../../helpers/render";
import { makeProps, noop, rect } from "./sticky-nav-test-support";

describe(StickyNav, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

    it("accounts for horizontal scrolling within the jump rail", () => {
      const container = document.createElement("div");
      const link = document.createElement("a");
      Object.defineProperty(container, "scrollLeft", { value: 180 });
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
        rect(100, 500)
      );
      vi.spyOn(link, "getBoundingClientRect").mockReturnValue(rect(140, 80));

      expect(computeIndicatorMetrics(link, container)).toStrictEqual({
        left: 220,
        width: 80,
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
