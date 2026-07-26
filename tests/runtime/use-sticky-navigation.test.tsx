import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";
import type { animateWithReducedMotion } from "@/shared/utils/springs";

const motion = vi.hoisted(() => ({
  animate: vi.fn<typeof animateWithReducedMotion>(),
}));

vi.mock(import("@/shared/utils/springs"), async (importOriginal) => ({
  ...(await importOriginal()),
  animateWithReducedMotion: motion.animate,
}));

const emptySections: { id: string; label: string }[] = [];

const NavHarness = ({
  sections = emptySections,
}: {
  sections?: { id: string; label: string }[];
}) => {
  const navigation = useStickyNavigation(document, sections);
  const { navRef, onJump } = navigation;
  return (
    <>
      <nav ref={navRef} />
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

  afterEach(() => {
    render(null, root);
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
