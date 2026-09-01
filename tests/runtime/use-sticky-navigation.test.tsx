import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";
import { stickyNavPreference } from "@/shared/runtime/sticky-nav-preference";
import type { animateWithReducedMotion } from "@/shared/utils/springs";

const motion = vi.hoisted(() => ({
  animate: vi.fn<typeof animateWithReducedMotion>(),
}));

vi.mock(import("@/shared/utils/springs"), async (importOriginal) => ({
  ...(await importOriginal()),
  animateWithReducedMotion: motion.animate,
}));

const emptySections: { id: string; label: string }[] = [];

const verticalRect = (top: number, bottom: number): DOMRectReadOnly =>
  ({
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top,
    width: 0,
    x: 0,
    y: top,
  }) as DOMRectReadOnly;

const NavHarness = ({
  sections = emptySections,
}: {
  sections?: { id: string; label: string }[];
}) => {
  const navigation = useStickyNavigation(document, sections);
  const { activeSectionId, navRef, onJump } = navigation;
  return (
    <>
      <nav data-active-section-id={activeSectionId} ref={navRef} />
      <button onClick={() => onJump(sections[0]?.id ?? "")} type="button">
        跳转
      </button>
    </>
  );
};

const stubIntersectionObserver = () => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      disconnect = vi.fn<() => void>();
      observe = vi.fn<(element: Element) => void>();
    }
  );
};

describe(useStickyNavigation, () => {
  let root: HTMLElement;

  afterEach(async () => {
    render(null, root);
    root.remove();
    await stickyNavPreference.setMode("auto");
    motion.animate.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses an opacity-only hidden target when reduced motion is requested", async () => {
    stubIntersectionObserver();
    root = document.createElement("div");
    render(<NavHarness />, root);

    await vi.waitFor(() => {
      expect(motion.animate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          reducedMotionProperties: { opacity: 0 },
        })
      );
    });
  });

  it("uses an opacity-only visible target when reduced motion is requested", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(301);
    stubIntersectionObserver();
    root = document.createElement("div");
    render(<NavHarness />, root);

    await vi.waitFor(() => {
      expect(motion.animate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          reducedMotionProperties: { opacity: 1 },
        })
      );
    });
  });

  it("shows the navigation from the top in always-visible mode", async () => {
    await stickyNavPreference.setMode("always");
    stubIntersectionObserver();
    root = document.createElement("div");
    render(<NavHarness />, root);

    await vi.waitFor(() => {
      expect(motion.animate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          properties: { opacity: 1, transform: "translateY(0)" },
        })
      );
    });
  });

  it("moves focus out before hiding a focused navigation", async () => {
    await stickyNavPreference.setMode("always");
    stubIntersectionObserver();
    root = document.createElement("div");
    root.id = "atv-douban-root";
    root.tabIndex = -1;
    document.body.append(root);
    render(<NavHarness />, root);
    const nav = root.querySelector("nav");
    const navControl = document.createElement("button");
    nav?.append(navControl);
    navControl.focus();

    await stickyNavPreference.setMode("auto");

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
  });

  it("activates the section at its scroll margin boundary", async () => {
    stubIntersectionObserver();
    const reviews = document.createElement("section");
    reviews.id = "atv-reviews";
    const discussions = document.createElement("section");
    discussions.id = "atv-discussions";
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element) =>
        ({
          scrollMarginTop: element === discussions ? "76px" : "64px",
        }) as CSSStyleDeclaration
    );
    const reviewsRect = vi
      .spyOn(reviews, "getBoundingClientRect")
      .mockReturnValue(verticalRect(-100, 300));
    const discussionsRect = vi
      .spyOn(discussions, "getBoundingClientRect")
      .mockReturnValue(verticalRect(300, 500));
    document.body.append(reviews, discussions);
    root = document.createElement("div");
    render(
      <NavHarness
        sections={[
          { id: "atv-reviews", label: "影评" },
          { id: "atv-discussions", label: "讨论" },
        ]}
      />,
      root
    );

    await vi.waitFor(() => {
      expect(root.querySelector("nav")?.dataset.activeSectionId).toBe(
        "atv-reviews"
      );
    });

    reviewsRect.mockReturnValue(verticalRect(-400, 76));
    discussionsRect.mockReturnValue(verticalRect(76.25, 276.25));
    window.dispatchEvent(new Event("scroll"));

    await vi.waitFor(() => {
      expect(root.querySelector("nav")?.dataset.activeSectionId).toBe(
        "atv-discussions"
      );
    });

    reviewsRect.mockReturnValue(verticalRect(-399, 77));
    discussionsRect.mockReturnValue(verticalRect(77.25, 277.25));
    window.dispatchEvent(new Event("scroll"));

    await vi.waitFor(() => {
      expect(root.querySelector("nav")?.dataset.activeSectionId).toBe(
        "atv-reviews"
      );
    });

    reviews.remove();
    discussions.remove();
  });

  it("updates the fragment and transfers focus to the jump destination", () => {
    stubIntersectionObserver();
    root = document.createElement("div");
    const target = document.createElement("section");
    target.id = "atv-photos";
    const scrollIntoView = vi
      .spyOn(target, "scrollIntoView")
      .mockImplementation(() => {});
    const focus = vi.spyOn(target, "focus").mockImplementation(() => {});
    document.body.append(target);

    render(
      <NavHarness sections={[{ id: "atv-photos", label: "剧照" }]} />,
      root
    );
    root.querySelector("button")?.click();

    expect(document.defaultView?.location.hash).toBe("#atv-photos");
    expect(target.getAttribute("tabindex")).toBe("-1");
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });

    target.remove();
  });
});
