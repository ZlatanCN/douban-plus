import type { AnimationPlaybackControlsWithThen } from "motion";
import { render } from "preact";
import type { ComponentChild } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModalSession, ModalShell } from "@/shared/components/modal";
import type {
  SwipeDismissDetails,
  SwipeToDismissOptions,
} from "@/shared/components/modal/use-swipe-to-dismiss";
import type { animateWithReducedMotion } from "@/shared/utils/springs";

import { renderIntoRoot } from "../helpers/render";

const renderedRoots: HTMLElement[] = [];

const trackedRenderIntoRoot = (node: ComponentChild): HTMLElement => {
  const root = renderIntoRoot(node);
  renderedRoots.push(root);
  return root;
};
const trackedRenderModal = (onClose: () => void, request: object = {}) =>
  trackedRenderIntoRoot(
    <ModalSession request={request}>
      <ModalShell
        className="atv-test-modal"
        id="atv-test-modal"
        onClose={onClose}
        surfaceClassName="atv-test-modal-surface"
      >
        内容
      </ModalShell>
    </ModalSession>
  );

const swipeCallbacks = vi.hoisted(() => {
  const callbacks: {
    onDismiss?: (details: SwipeDismissDetails) => void;
  } = {};
  return callbacks;
});
const swipeRef = vi.hoisted(() => vi.fn<(el: HTMLElement | null) => void>());
const mockUseSwipeToDismiss = vi.hoisted(() =>
  vi.fn<
    (options: SwipeToDismissOptions) => {
      ref: (el: HTMLElement | null) => void;
    }
  >((options) => {
    swipeCallbacks.onDismiss = options.onDismiss;
    return { ref: swipeRef };
  })
);

const motion = vi.hoisted(() => {
  const animations: { resolve: () => void }[] = [];
  const animate = vi.fn<typeof animateWithReducedMotion>(() => {
    const completion = Promise.withResolvers<null>();
    animations.push({ resolve: () => completion.resolve(null) });
    return Object.assign(completion.promise, {
      attachTimeline: vi.fn<(...args: unknown[]) => VoidFunction>(),
      cancel: vi.fn<(...args: unknown[]) => void>(),
      complete: vi.fn<(...args: unknown[]) => void>(),
      duration: 0,
      finished: completion.promise,
      iterationDuration: 0,
      pause: vi.fn<(...args: unknown[]) => void>(),
      play: vi.fn<(...args: unknown[]) => void>(),
      speed: 1,
      startTime: null,
      state: "running" as const,
      stop: vi.fn<(...args: unknown[]) => void>(),
      time: 0,
    }) satisfies AnimationPlaybackControlsWithThen;
  });

  return { animate, animations };
});

vi.mock(import("@/shared/utils/springs"), () => ({
  animateWithReducedMotion: motion.animate,
  springConfigs: {
    carouselSnap: { damping: 18, stiffness: 200, type: "spring" },
    contentEntrance: { damping: 28, stiffness: 300, type: "spring" },
    modalBackdrop: { bounce: 0, duration: 0.4, type: "spring" },
    modalSurface: { bounce: 0, duration: 0.35, type: "spring" },
    ratingEntrance: { bounce: 0, duration: 0.3, type: "spring" },
    reviewBodyEntrance: { bounce: 0, duration: 0.35, type: "spring" },
    stickyNav: { bounce: 0, duration: 0.3, type: "spring" },
    summaryEntrance: { bounce: 0, duration: 0.3, type: "spring" },
    swipeDismissExit: { bounce: 0.2, duration: 0.4, type: "spring" },
    swipeSettleBack: { damping: 15, stiffness: 180, type: "spring" },
  } as const,
}));

vi.mock(import("@/shared/components/modal/use-swipe-to-dismiss"), () => ({
  useSwipeToDismiss: mockUseSwipeToDismiss,
}));

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  vi.advanceTimersByTime(50);
  await Promise.resolve();
};

const flushAnimationSettlement = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe(ModalShell, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    motion.animations.length = 0;
    motion.animate.mockClear();
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });

  afterEach(() => {
    for (const root of renderedRoots) {
      render(null, root);
    }
    renderedRoots.length = 0;
    // Fire any pending timers to flush Preact's afterPaintEffects and clean up
    // stale components. This prevents afterPaintEffects from accumulating
    // components with _parentDom from detached roots, which would break the
    // afterPaint scheduling guard (newQueueLength === 1) in subsequent tests.
    vi.advanceTimersByTime(200);
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses independent critically-damped springs for the backdrop and surface on mount", async () => {
    const root = trackedRenderModal(vi.fn<() => void>());

    await flushEffects();

    const overlay = root.querySelector<HTMLDialogElement>("dialog");
    const surface = root.querySelector<HTMLDivElement>(
      ".atv-test-modal-surface"
    );
    expect(motion.animate).toHaveBeenNthCalledWith(1, overlay, {
      properties: { opacity: 1 },
      reducedMotionProperties: { opacity: 1 },
      springConfig: { bounce: 0, duration: 0.4, type: "spring" },
    });
    expect(motion.animate).toHaveBeenNthCalledWith(2, surface, {
      properties: { opacity: 1, transform: "scale(1) translateY(0)" },
      reducedMotionProperties: { opacity: 1 },
      springConfig: { bounce: 0, duration: 0.35, type: "spring" },
    });
  });

  it("only notifies its owner after both close springs settle", async () => {
    const onClose = vi.fn<() => void>();
    const root = trackedRenderModal(onClose);
    const overlay = root.querySelector<HTMLDialogElement>("dialog");

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();
    expect(overlay?.style.pointerEvents).toBe("none");

    motion.animations[2]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).not.toHaveBeenCalled();

    motion.animations[3]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("retargets a reopened modal session while the close spring is running", async () => {
    const onClose = vi.fn<() => void>();
    const root = trackedRenderModal(onClose, {});
    const overlay = root.querySelector<HTMLDialogElement>("dialog");

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();
    render(
      <ModalSession request={{}}>
        <ModalShell
          className="atv-test-modal"
          id="atv-test-modal"
          onClose={onClose}
          surfaceClassName="atv-test-modal-surface"
        >
          内容
        </ModalShell>
      </ModalSession>,
      root
    );
    await flushEffects();

    expect(motion.animate).toHaveBeenCalledTimes(6);
    expect(motion.animate).toHaveBeenNthCalledWith(5, overlay, {
      properties: { opacity: 1 },
      reducedMotionProperties: { opacity: 1 },
      springConfig: { bounce: 0, duration: 0.4, type: "spring" },
    });
    motion.animations[2]?.resolve();
    motion.animations[3]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).not.toHaveBeenCalled();

    await flushEffects();
    expect(overlay?.style.pointerEvents).toBe("auto");

    motion.animations[4]?.resolve();
    motion.animations[5]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves the surface below the viewport while closing", async () => {
    const root = trackedRenderModal(vi.fn<() => void>());
    const overlay = root.querySelector<HTMLDialogElement>("dialog");
    const surface = root.querySelector<HTMLDivElement>(
      ".atv-test-modal-surface"
    );

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();

    expect(motion.animate).toHaveBeenNthCalledWith(4, surface, {
      properties: {
        opacity: 0,
        transform: "scale(0.92) translateY(100dvh)",
      },
      reducedMotionProperties: { opacity: 0 },
      springConfig: { bounce: 0, duration: 0.35, type: "spring" },
    });
  });

  it("keeps the surface at its normal geometry for reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({
      addEventListener: vi.fn<() => void>(),
      matches: true,
      removeEventListener: vi.fn<() => void>(),
    }));

    const root = trackedRenderModal(vi.fn<() => void>());
    const surface = root.querySelector<HTMLDivElement>(
      ".atv-test-modal-surface"
    );

    expect(surface?.style.transform).toBe("none");
  });

  describe("dismissable", () => {
    it("applies touch-action pan-x when dismissable is true", () => {
      const root = trackedRenderIntoRoot(
        <ModalShell
          className="atv-test-modal"
          dismissable
          id="atv-test-modal"
          onClose={vi.fn<() => void>()}
          surfaceClassName="atv-test-modal-surface"
        >
          内容
        </ModalShell>
      );
      const surface = root.querySelector<HTMLDivElement>(
        ".atv-test-modal-surface"
      );
      expect(surface?.style.touchAction).toBe("pan-x");
    });

    it("calls useSwipeToDismiss with onDismiss callback when dismissable is true", () => {
      mockUseSwipeToDismiss.mockClear();
      trackedRenderIntoRoot(
        <ModalShell
          className="atv-test-modal"
          dismissable
          id="atv-test-modal"
          onClose={vi.fn<() => void>()}
          surfaceClassName="atv-test-modal-surface"
        >
          内容
        </ModalShell>
      );
      expect(mockUseSwipeToDismiss).toHaveBeenCalledWith(
        expect.objectContaining({ onDismiss: expect.any(Function) })
      );
    });

    it("uses swipeDismissExit spring config when closing via swipe", async () => {
      mockUseSwipeToDismiss.mockClear();
      motion.animate.mockClear();
      const onClose = vi.fn<() => void>();
      const root = trackedRenderIntoRoot(
        <ModalShell
          className="atv-test-modal"
          dismissable
          id="atv-test-modal"
          onClose={onClose}
          surfaceClassName="atv-test-modal-surface"
        >
          内容
        </ModalShell>
      );

      await flushEffects();
      // After mount animation, motion.animate should have been called twice
      expect(motion.animate).toHaveBeenCalledTimes(2);

      // The swipe callback should be captured
      expect(swipeCallbacks.onDismiss).toBeDefined();

      swipeCallbacks.onDismiss?.({ position: 90, velocity: 640 });

      // After dismiss, motion.animate should have been called 4 times
      expect(motion.animate).toHaveBeenCalledTimes(4);

      const surface = root.querySelector<HTMLDivElement>(
        ".atv-test-modal-surface"
      );

      expect(motion.animate).toHaveBeenNthCalledWith(4, surface, {
        properties: {
          opacity: 0,
          transform: "translateY(100dvh)",
        },
        reducedMotionProperties: { opacity: 0 },
        springConfig: {
          bounce: 0.2,
          duration: 0.4,
          type: "spring",
          velocity: 640,
        },
      });
    });

    it("backdrop click still works when dismissable is true", async () => {
      const onClose = vi.fn<() => void>();
      const root = trackedRenderIntoRoot(
        <ModalShell
          className="atv-test-modal"
          dismissable
          id="atv-test-modal"
          onClose={onClose}
          surfaceClassName="atv-test-modal-surface"
        >
          内容
        </ModalShell>
      );
      const overlay = root.querySelector<HTMLDialogElement>("dialog");

      await flushEffects();
      overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushEffects();

      motion.animations[2]?.resolve();
      motion.animations[3]?.resolve();
      await flushAnimationSettlement();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("escape key still works when dismissable is true", async () => {
      const onClose = vi.fn<() => void>();
      trackedRenderIntoRoot(
        <ModalShell
          className="atv-test-modal"
          dismissable
          id="atv-test-modal"
          onClose={onClose}
          surfaceClassName="atv-test-modal-surface"
        >
          内容
        </ModalShell>
      );

      await flushEffects();
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
      );
      await flushEffects();

      motion.animations[2]?.resolve();
      motion.animations[3]?.resolve();
      await flushAnimationSettlement();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
