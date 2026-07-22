import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStickyNavigation } from "@/modules/subject/runtime/use-sticky-navigation";
import type { animateWithReducedMotion } from "@/shared/utils/springs";

const motion = vi.hoisted(() => ({
  animate: vi.fn<typeof animateWithReducedMotion>(),
}));

vi.mock(import("@/shared/utils/springs"), async (importOriginal) => ({
  ...(await importOriginal()),
  animateWithReducedMotion: motion.animate,
}));

const NavHarness = () => {
  const navigation = useStickyNavigation(document, []);
  /* eslint-disable-next-line react-compiler/react-compiler -- the hook deliberately exposes a Preact object ref. */
  return <nav ref={navigation.navRef} />;
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
});
